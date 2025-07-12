import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OutboxEventStatusEnum } from '../dto/outbox-event.dto';
import { QueryTypes } from 'sequelize';
import { WithError, OutboxError, OutboxErrorCode } from '../types/result.type';
import {
  OUTBOX_EVENT_TYPE_KEY,
  OUTBOX_ENTITY_TYPE_KEY,
} from '../decorators/outbox-event.decorator';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OutboxTelemetryService } from '../services/outbox-telemetry.service';

const SQL_INSERT_OUTBOX_EVENT = `
INSERT INTO :schema.:table (
  entity_uuid,
  entity_type,
  event_date,
  user_d_login,
  status,
  event_type,
  payload_as_json
) VALUES
`;

interface OutboxRequest extends Request {
  userInfo?: {
    username: string;
  };
  transaction?: any;
}

@Injectable()
export class OutboxInterceptor implements NestInterceptor {
  sql: Record<string, string>;
  private readonly sequelize: Sequelize;

  constructor(
    @Optional() @InjectConnection() defaultSequelize: Sequelize,
    @Optional() @Inject(EXTERNAL_SEQUELIZE_TOKEN) externalSequelize: Sequelize,
    private readonly reflector: Reflector,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
    @Optional() private readonly telemetryService?: OutboxTelemetryService,
  ) {
    this.sequelize = externalSequelize || defaultSequelize;

    if (!this.sequelize) {
      throw new Error('No Sequelize connection provided.');
    }

    this.sql = {
      insertOutboxEvent: this.replaceTablePlaceholders(SQL_INSERT_OUTBOX_EVENT),
    } as const;
  }

  private replaceTablePlaceholders(sql: string): string {
    const schema = this.config.database?.schema || 'public';
    const tableName = this.config.database?.tableName || 'outbox_events';
    return sql.replace(/:schema/g, schema).replace(/:table/g, tableName);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const eventType = this.reflector.getAllAndOverride(OUTBOX_EVENT_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const entityType = this.reflector.getAllAndOverride(
      OUTBOX_ENTITY_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!eventType || !entityType) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (res: WithError<any>) => {
        if (!res.data) {
          return res;
        }

        const data = Array.isArray(res.data) ? res.data : [res.data];
        const request = context.switchToHttp().getRequest<OutboxRequest>();
        const user = request.userInfo || { username: 'system' };
        const transaction = request.transaction;

        // Validate that all items have uuid
        for (const item of data) {
          if (!item.uuid) {
            throw new OutboxError(
              400,
              OutboxErrorCode.VALIDATION_ERROR,
              'Outbox event requires uuid field in returned data object',
            );
          }
        }

        const outboxEventValues: any[] = [];
        const baseTime = Date.now();
        
        data.forEach((item, index) => {
          // Generate unique timestamp by adding microseconds
          const eventDate = new Date(baseTime + index);
          
          outboxEventValues.push(
            item.uuid,
            entityType,
            eventDate.toISOString(),
            user.username,
            OutboxEventStatusEnum.READY_TO_SEND,
            eventType,
            JSON.stringify(item),
          );
        });

        // Build VALUES clause with proper placeholders
        const valuesPerRow = 7;
        const valuesClauses = data.map((_, index) => {
          const startIndex = index * valuesPerRow + 1;
          const placeholders = Array.from(
            { length: valuesPerRow }, 
            (_, i) => `$${startIndex + i}`
          ).join(', ');
          return `(${placeholders})`;
        }).join(', ');

        const fullSql = `${this.sql.insertOutboxEvent} ${valuesClauses}`;

        try {
          await this.sequelize.query(fullSql, {
            bind: outboxEventValues,
            transaction,
            type: QueryTypes.INSERT,
          });

          if (this.telemetryService) {
            data.forEach(() => {
              this.telemetryService!.recordEventCreated(entityType, eventType);
            });
          }
        } catch (pgError) {
          const error = new OutboxError(
            500,
            OutboxErrorCode.DATABASE_ERROR,
            'Ошибка при создании записи в Postgres: не удалось создать запись о Событии outbox',
            pgError instanceof Error ? pgError.stack : undefined,
            pgError,
          );
          error.throwAsHttpException('Global.OutboxInterceptor');
        }
        return res;
      }),
    );
  }
}
