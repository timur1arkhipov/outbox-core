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
import { Injectable, Inject, Optional, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { OutboxEventDto } from '../dto/outbox-event.dto';
import { OutboxError, OutboxErrorCode, } from '../types/result.type';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import { sql_updateOutboxEvent, sql_selectOutboxEvents, sql_selectBeforeOutboxEvents, sql_cleanupStuckEventsReadyToSend, sql_cleanupStuckEventsError, } from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';
let OutboxDbService = class OutboxDbService {
    constructor(defaultSequelize, externalSequelize, config) {
        this.config = config;
        this.sequelize = externalSequelize || defaultSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided.');
        }
        this.sql = {
            updateOutboxEvent: replaceTablePlaceholders(sql_updateOutboxEvent, this.config.database.schema, this.config.database.tableName),
            selectOutboxEvents: replaceTablePlaceholders(sql_selectOutboxEvents, this.config.database.schema, this.config.database.tableName),
            selectBeforeOutboxEvents: replaceTablePlaceholders(sql_selectBeforeOutboxEvents, this.config.database.schema, this.config.database.tableName),
            cleanupStuckEventsReadyToSend: replaceTablePlaceholders(sql_cleanupStuckEventsReadyToSend, this.config.database.schema, this.config.database.tableName),
            cleanupStuckEventsError: replaceTablePlaceholders(sql_cleanupStuckEventsError, this.config.database.schema, this.config.database.tableName),
        };
    }
    async updateOutboxEvent(uuids, data, transaction) {
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
        }
        catch (pgError) {
            return {
                data: null,
                _error: new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.DATABASE_ERROR, 'Ошибка при обновлении записи в Postgres: не удалось обновить запись о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
    }
    async selectOutboxEventsInfomodels(filters, transaction) {
        let pgData;
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
        }
        catch (pgError) {
            return {
                data: null,
                _error: new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.DATABASE_ERROR, 'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
        const infoModels = OutboxEventDto.fromPgData(pgData);
        return {
            data: infoModels,
            _error: null,
        };
    }
    async selectBeforeOutboxEventsInfomodels(entity_uuids, transaction) {
        let pgData;
        try {
            pgData = await this.sequelize.query(this.sql.selectBeforeOutboxEvents, {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { entity_uuids },
            });
        }
        catch (pgError) {
            return {
                data: null,
                _error: new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.DATABASE_ERROR, 'Ошибка при получении данных из Postgres: не удалось получить данные о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
        const infoModels = OutboxEventDto.fromPgData(pgData);
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
                type: QueryTypes.UPDATE,
            });
            const errorResult = await this.sequelize.query(this.sql.cleanupStuckEventsError, {
                replacements: {
                    timeout_minutes: timeoutMinutes,
                    max_retries: maxRetries,
                },
                transaction,
                type: QueryTypes.UPDATE,
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
                _error: new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.DATABASE_ERROR, 'Ошибка при очистке зависших событий outbox в Postgres', pgError instanceof Error ? pgError.stack : undefined, pgError),
            };
        }
    }
};
OutboxDbService = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, InjectConnection()),
    __param(1, Optional()),
    __param(1, Inject(EXTERNAL_SEQUELIZE_TOKEN)),
    __param(2, Inject(OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [Sequelize,
        Sequelize, Object])
], OutboxDbService);
export { OutboxDbService };
//# sourceMappingURL=outbox.db.service.js.map