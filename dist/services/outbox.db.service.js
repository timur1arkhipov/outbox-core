"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxDbService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_2 = require("sequelize");
const outbox_event_dto_1 = require("../dto/outbox-event.dto");
const result_type_1 = require("../types/result.type");
const constants_1 = require("../constants");
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
let OutboxDbService = class OutboxDbService {
    constructor(defaultSequelize, externalSequelize, config) {
        this.config = config;
        this.sequelize = externalSequelize || defaultSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided. Either configure database settings or provide external connection token.');
        }
        this.sql = {
            updateOutboxEvent: this.replaceTablePlaceholders(SQL_UPDATE_OUTBOX_EVENT),
            selectOutboxEvents: this.replaceTablePlaceholders(SQL_SELECT_OUTBOX_EVENTS),
            selectBeforeOutboxEvents: this.replaceTablePlaceholders(SQL_SELECT_BEFORE_OUTBOX_EVENTS),
            cleanupStuckEventsReadyToSend: this.replaceTablePlaceholders(SQL_CLEANUP_STUCK_EVENTS_READY_TO_SEND),
            cleanupStuckEventsError: this.replaceTablePlaceholders(SQL_CLEANUP_STUCK_EVENTS_ERROR),
        };
    }
    replaceTablePlaceholders(sql) {
        const schema = this.config.database?.schema || 'public';
        const tableName = this.config.database?.tableName || 'outbox_events';
        return sql.replace(/:schema/g, schema).replace(/:table/g, tableName);
    }
    async updateOutboxEvent(uuids, data, transaction) {
        try {
            await this.sequelize.query(this.sql.updateOutboxEvent, {
                replacements: {
                    event_uuids: uuids,
                    status: data.status,
                },
                transaction,
                type: sequelize_2.QueryTypes.RAW,
            });
            return {
                data: null,
                _error: null,
            };
        }
        catch (pgError) {
            return {
                data: null,
                _error: new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.DATABASE_ERROR, 'Ошибка при обновлении записи в Postgres: не удалось обновить запись о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
    }
    async selectOutboxEventsInfomodels(filters, transaction) {
        let pgData;
        try {
            pgData = await this.sequelize.query(this.sql.selectOutboxEvents, {
                type: sequelize_2.QueryTypes.SELECT,
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
        }
        catch (pgError) {
            return {
                data: null,
                _error: new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.DATABASE_ERROR, 'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
        const infoModels = outbox_event_dto_1.OutboxEventDto.fromPgData(pgData);
        return {
            data: infoModels,
            _error: null,
        };
    }
    async selectBeforeOutboxEventsInfomodels(entity_uuids, transaction) {
        let pgData;
        try {
            pgData = await this.sequelize.query(this.sql.selectBeforeOutboxEvents, {
                type: sequelize_2.QueryTypes.SELECT,
                transaction,
                replacements: { entity_uuids },
            });
        }
        catch (pgError) {
            return {
                data: null,
                _error: new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.DATABASE_ERROR, 'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
        const infoModels = outbox_event_dto_1.OutboxEventDto.fromPgData(pgData);
        return {
            data: infoModels,
            _error: null,
        };
    }
    async cleanupStuckEvents(timeoutMinutes = 5, maxRetries = 3, transaction) {
        try {
            const readyResult = await this.sequelize.query(this.sql.cleanupStuckEventsReadyToSend, {
                replacements: {
                    timeout_minutes: timeoutMinutes,
                    max_retries: maxRetries,
                },
                transaction,
                type: sequelize_2.QueryTypes.UPDATE,
            });
            const errorResult = await this.sequelize.query(this.sql.cleanupStuckEventsError, {
                replacements: {
                    timeout_minutes: timeoutMinutes,
                    max_retries: maxRetries,
                },
                transaction,
                type: sequelize_2.QueryTypes.UPDATE,
            });
            return {
                data: {
                    updatedToReady: Array.isArray(readyResult) ? readyResult[1] : 0,
                    updatedToError: Array.isArray(errorResult) ? errorResult[1] : 0,
                },
                _error: null,
            };
        }
        catch (pgError) {
            return {
                data: null,
                _error: new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.DATABASE_ERROR, 'Ошибка при очистке зависших событий outbox в Postgres', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
    }
};
exports.OutboxDbService = OutboxDbService;
exports.OutboxDbService = OutboxDbService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, sequelize_1.InjectConnection)()),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.EXTERNAL_SEQUELIZE_TOKEN)),
    __param(2, (0, common_1.Inject)(constants_1.OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize,
        sequelize_typescript_1.Sequelize, Object])
], OutboxDbService);
//# sourceMappingURL=outbox.db.service.js.map