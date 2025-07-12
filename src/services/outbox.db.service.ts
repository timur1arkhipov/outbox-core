import { Injectable, Inject, Optional } from '@nestjs/common';
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
import { OutboxConfig } from '../interfaces/outbox-config.interface';

const SQL_UPDATE_OUTBOX_EVENT = `
UPDATE :schema.:table
SET
  retry_count = CASE
    WHEN (:status = 'ERROR') THEN COALESCE(retry_count, 0) + 1
    ELSE retry_count
  END,
  status = :status
WHERE event_s_uuid IN (:event_uuids);
`;

const SQL_SELECT_OUTBOX_EVENTS = `
SELECT 
	ev.event_s_uuid,
	ev.entity_uuid,
	ev.entity_type,
	ev.event_date as created_at,
	ev.user_d_login as created_by,
	ev.status,
	ev.event_type,
	ev.payload_as_json,
	ev.retry_count
FROM :schema.:table ev
WHERE
  ((:event_uuids) IS NULL OR ev.event_s_uuid IN (:event_uuids))
	AND
	((:entity_uuids) IS NULL OR ev.entity_uuid IN (:entity_uuids))
	AND
	((:entity_types) IS NULL OR ev.entity_type IN (:entity_types))
	AND
	((:status) IS NULL OR ev.status IN (:status))
	AND
	((:with_lock) IS NULL OR (:with_lock) = false OR ev.status IN ('READY_TO_SEND', 'ERROR'))
ORDER BY ev.event_date ASC
FOR UPDATE SKIP LOCKED;
`;

const SQL_SELECT_BEFORE_OUTBOX_EVENTS = `
SELECT m.* FROM 
  (
		SELECT 
			entity_uuid, 
			MAX(event_date) AS max_created_at
		FROM :schema.:table
		WHERE 
			status IN ('SENT', 'ERROR')
			AND 
			entity_uuid IN (:entity_uuids)
		GROUP BY entity_uuid
	) t JOIN :schema.:table m 
		ON t.entity_uuid = m.entity_uuid
		AND t.max_created_at = m.event_date
	ORDER BY event_date DESC;
`;

const SQL_CLEANUP_STUCK_EVENTS_READY_TO_SEND = `
UPDATE :schema.:table
SET 
  status = 'READY_TO_SEND',
  retry_count = COALESCE(retry_count, 0) + 1
WHERE 
  status = 'PROCESSING' 
  AND event_date < NOW() - (:timeout_minutes || ' minutes')::INTERVAL
  AND retry_count < :max_retries;
`;

const SQL_CLEANUP_STUCK_EVENTS_ERROR = `
UPDATE :schema.:table
SET status = 'ERROR'
WHERE 
  status = 'PROCESSING' 
  AND event_date < NOW() - (:timeout_minutes || ' minutes')::INTERVAL
  AND retry_count >= :max_retries;
`;

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
        'No Sequelize connection provided. Either configure database settings or provide external connection token.',
      );
    }
    this.sql = {
      updateOutboxEvent: this.replaceTablePlaceholders(SQL_UPDATE_OUTBOX_EVENT),
      selectOutboxEvents: this.replaceTablePlaceholders(
        SQL_SELECT_OUTBOX_EVENTS,
      ),
      selectBeforeOutboxEvents: this.replaceTablePlaceholders(
        SQL_SELECT_BEFORE_OUTBOX_EVENTS,
      ),
      cleanupStuckEventsReadyToSend: this.replaceTablePlaceholders(
        SQL_CLEANUP_STUCK_EVENTS_READY_TO_SEND,
      ),
      cleanupStuckEventsError: this.replaceTablePlaceholders(
        SQL_CLEANUP_STUCK_EVENTS_ERROR,
      ),
    } as const;
  }

  private replaceTablePlaceholders(sql: string): string {
    const schema = this.config.database?.schema || 'public';
    const tableName = this.config.database?.tableName || 'outbox_events';
    return sql.replace(/:schema/g, schema).replace(/:table/g, tableName);
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
          500,
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
        },
      });
    } catch (pgError) {
      return {
        data: null,
        _error: new OutboxError(
          500,
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
          500,
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
          500,
          OutboxErrorCode.DATABASE_ERROR,
          'Ошибка при очистке зависших событий outbox в Postgres',
          pgError instanceof Error ? pgError.stack : undefined,
          pgError,
        ),
      };
    }
  }
}
