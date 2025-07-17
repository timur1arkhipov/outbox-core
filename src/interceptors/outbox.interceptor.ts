import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
  Inject,
  Optional,
  HttpStatus,
} from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OutboxEventStatusEnum } from '../dto/outbox-event.dto';
import { QueryTypes } from 'sequelize';
import { WithError, OutboxError, OutboxErrorCode } from '../types/result.type';
import {
  OUTBOX_TOPIC_KEY,
  OUTBOX_EVENT_TYPE_KEY,
} from '../decorators/outbox-event.decorator';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OutboxRequest } from '../types/outbox-request';
import { sql_insertOutboxEvent } from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';

@Injectable()
export class OutboxInterceptor implements NestInterceptor {
  sql: Record<string, string>;
  private readonly sequelize: Sequelize;

  constructor(
    @Optional() @InjectConnection() internalSequelize: Sequelize,
    @Optional() @Inject(EXTERNAL_SEQUELIZE_TOKEN) externalSequelize: Sequelize,
    private readonly reflector: Reflector,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
  ) {
    this.sequelize = externalSequelize || internalSequelize;

    if (!this.sequelize) {
      throw new Error('No Sequelize connection provided.');
    }

    this.sql = {
      insertOutboxEvent: replaceTablePlaceholders(
        sql_insertOutboxEvent,
        this.config.database.schema,
        this.config.database.tableName,
      ),
    };
  }



  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const topicKey = this.reflector.getAllAndOverride(OUTBOX_TOPIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const eventType = this.reflector.getAllAndOverride(OUTBOX_EVENT_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);



    if (!topicKey || !eventType) {
      return next.handle();
    }

    const topicConfig = this.config.topics[topicKey];
    if (!topicConfig) {
      throw new Error(`Topic configuration '${topicKey}' not found`);
    }

    return next.handle().pipe(
      mergeMap(async (res: WithError<any>) => {
        if (!res.data) {
          return res;
        }

        const data = Array.isArray(res.data) ? res.data : [res.data];
        const request = context.switchToHttp().getRequest<OutboxRequest>();
        const user = request.userInfo;
        let transaction = request.transaction;
        
        const outboxEventValues = data.map((item, index) => {
          const eventDate = new Date();
          eventDate.setMilliseconds(eventDate.getMilliseconds() + index);
          
          let entityType = item.entity_type || item.entityType;
          if (!entityType && topicConfig.entityTypes.length > 0) {
            entityType = topicConfig.entityTypes[0];
          }
          if (!entityType) {
            entityType = 'unknown';
          }
          
          if (!topicConfig.entityTypes.includes(entityType)) {
            throw new Error(
              `Entity type '${entityType}' is not allowed for topic '${topicKey}'. ` +
              `Allowed types: ${topicConfig.entityTypes.join(', ')}`
            );
          }

          const payload = JSON.parse(JSON.stringify(item));
          
          return [
            item.uuid,
            entityType,
            eventDate.toISOString(),
            user.username,
            OutboxEventStatusEnum.READY_TO_SEND,
            eventType,
            JSON.stringify(payload),
          ];
        });

        try {
          await this.sequelize.query(this.sql.insertOutboxEvent, {
              replacements: {
                outbox_events: outboxEventValues,
              },
              transaction,
              type: QueryTypes.RAW,
        });

        } catch (pgError) {
          new OutboxError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            OutboxErrorCode.DATABASE_ERROR,
            'Ошибка при создании записи в Postgres: не удалось создать запись о Событии outbox',
            pgError instanceof Error ? pgError.stack : undefined,
            pgError,
          ).throwAsHttpException('Global.OutboxInterceptor');
        }
        return res;
      }),
    );
  }
}
