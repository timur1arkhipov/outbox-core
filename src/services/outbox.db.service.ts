import { Injectable, Inject, Optional, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction, QueryTypes } from 'sequelize';
import { UpdateOutboxEventDto } from '../dto/update-outbox-event.dto';
import { OutboxEventDto, PgOutboxEvent } from '../dto/outbox-event.dto';
import { OutboxEventFiltersDto } from '../dto/outbox-event-filters.dto';
import { CleanupResultDto } from '../dto/cleanup-result.dto';
import {
  PromiseWithError,
  OutboxError,
  OutboxErrorCode,
} from '../types/result.type';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
import {
  sql_updateOutboxEvent,
  sql_selectOutboxEvents,
  sql_selectBeforeOutboxEvents,
  sql_cleanupStuckEventsReadyToSend,
  sql_cleanupStuckEventsError,
} from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';

@Injectable()
export class OutboxDbService {
  sql: Record<string, string>;
  private sequelize: Sequelize;

  constructor(
    @Optional() @InjectConnection() defaultSequelize: Sequelize,
    @Optional() @Inject(EXTERNAL_SEQUELIZE_TOKEN) externalSequelize: Sequelize,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
  ) {
    this.sequelize = externalSequelize || defaultSequelize;

    if (!this.sequelize) {
      throw new Error(
        'No Sequelize connection provided.',
      );
    }
    this.sql = {
      updateOutboxEvent: replaceTablePlaceholders(
        sql_updateOutboxEvent,
        this.config.database.schema,
        this.config.database.tableName,
      ),
      selectOutboxEvents: replaceTablePlaceholders(
        sql_selectOutboxEvents,
        this.config.database.schema,
        this.config.database.tableName,
      ),
      selectBeforeOutboxEvents: replaceTablePlaceholders(
        sql_selectBeforeOutboxEvents,
        this.config.database.schema,
        this.config.database.tableName,
      ),
      cleanupStuckEventsReadyToSend: replaceTablePlaceholders(
        sql_cleanupStuckEventsReadyToSend,
        this.config.database.schema,
        this.config.database.tableName,
      ),
      cleanupStuckEventsError: replaceTablePlaceholders(
        sql_cleanupStuckEventsError,
        this.config.database.schema,
        this.config.database.tableName,
      ),
    } as const;
  }



  public async updateOutboxEvent(
    uuids: string[],
    data: UpdateOutboxEventDto,
    transaction?: Transaction,
  ): PromiseWithError<void> {
    try {
      await this.sequelize.query(this.sql.updateOutboxEvent, {
        replacements: {
          event_uuids: uuids,
          status: data.status,
        },
        transaction,
        type: QueryTypes.RAW,
      });

      return {
        data: null,
        _error: null,
      };
    } catch (pgError) {
      return {
        data: null,
        _error: new OutboxError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          OutboxErrorCode.DATABASE_ERROR,
          'Ошибка при обновлении записи в Postgres: не удалось обновить запись о Событии outbox',
          pgError instanceof Error ? pgError.stack : undefined,
          pgError,
        ),
      };
    }
  }

  public async selectOutboxEventsInfomodels(
    filters: OutboxEventFiltersDto,
    transaction?: Transaction,
  ): PromiseWithError<OutboxEventDto[]> {
    let pgData: PgOutboxEvent[];
    try {
      pgData = await this.sequelize.query(this.sql.selectOutboxEvents, {
        type: QueryTypes.SELECT,
        transaction,
        replacements: {
          event_uuids: filters.uuid?.length ? filters.uuid : null,
          entity_uuids: filters.entities?.length
            ? filters.entities.map((entity) => entity.uuid)
            : null,
          entity_types: filters.entity_types?.length
            ? filters.entity_types
            : null,
          status: filters.status?.length ? filters.status : null,
          with_lock: filters.with_lock ?? null,
          limit: filters.limit ?? this.config.defaultProcessing.chunkSize,
        },
      });
    } catch (pgError) {
      return {
        data: null,
        _error: new OutboxError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          OutboxErrorCode.DATABASE_ERROR,
          'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox',
          pgError instanceof Error ? pgError.stack : undefined,
          pgError,
        ),
      };
    }

    const infoModels = OutboxEventDto.fromPgData(pgData);

    return {
      data: infoModels,
      _error: null,
    };
  }

  public async selectBeforeOutboxEventsInfomodels(
    entity_uuids: string[],
    transaction?: Transaction,
  ): PromiseWithError<OutboxEventDto[]> {
    let pgData: PgOutboxEvent[];
    try {
      pgData = await this.sequelize.query(this.sql.selectBeforeOutboxEvents, {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { entity_uuids },
      });
    } catch (pgError) {
      return {
        data: null,
        _error: new OutboxError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          OutboxErrorCode.DATABASE_ERROR,
          'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox',
          pgError instanceof Error ? pgError.stack : undefined,
          pgError,
        ),
      };
    }

    const infoModels = OutboxEventDto.fromPgData(pgData);

    return {
      data: infoModels,
      _error: null,
    };
  }

  public async cleanupStuckEvents(
    timeoutMinutes: number = 5,
    maxRetries: number = 3,
    transaction?: Transaction,
  ): PromiseWithError<CleanupResultDto> {
    try {
      const readyResult = await this.sequelize.query(
        this.sql.cleanupStuckEventsReadyToSend,
        {
          replacements: {
            timeout_minutes: timeoutMinutes,
            max_retries: maxRetries,
          },
          transaction,
          type: QueryTypes.UPDATE,
        },
      );

      const errorResult = await this.sequelize.query(
        this.sql.cleanupStuckEventsError,
        {
          replacements: {
            timeout_minutes: timeoutMinutes,
            max_retries: maxRetries,
          },
          transaction,
          type: QueryTypes.UPDATE,
        },
      );

      return {
        data: {
          updatedToReady: Array.isArray(readyResult) ? readyResult[1] : 0,
          updatedToError: Array.isArray(errorResult) ? errorResult[1] : 0,
        },
        _error: null,
      };
    } catch (pgError) {
      return {
        data: null,
        _error: new OutboxError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          OutboxErrorCode.DATABASE_ERROR,
          'Ошибка при очистке зависших событий outbox в Postgres',
          pgError instanceof Error ? pgError.stack : undefined,
          pgError,
        ),
      };
    }
  }
}
