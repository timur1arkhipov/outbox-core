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
import { Injectable, Inject, Optional, HttpStatus, } from '@nestjs/common';
import { mergeMap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OutboxEventStatusEnum } from '../dto/outbox-event.dto';
import { QueryTypes } from 'sequelize';
import { OutboxError, OutboxErrorCode } from '../types/result.type';
import { OUTBOX_TOPIC_KEY, OUTBOX_EVENT_TYPE_KEY, } from '../decorators/outbox-event.decorator';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import { sql_insertOutboxEvent } from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';
let OutboxInterceptor = class OutboxInterceptor {
    constructor(internalSequelize, externalSequelize, reflector, config) {
        this.reflector = reflector;
        this.config = config;
        this.sequelize = externalSequelize || internalSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided.');
        }
        this.sql = {
            insertOutboxEvent: replaceTablePlaceholders(sql_insertOutboxEvent, this.config.database.schema, this.config.database.tableName),
        };
    }
    async intercept(context, next) {
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
        return next.handle().pipe(mergeMap(async (res) => {
            if (!res.data) {
                return res;
            }
            const data = Array.isArray(res.data) ? res.data : [res.data];
            const request = context.switchToHttp().getRequest();
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
                    throw new Error(`Entity type '${entityType}' is not allowed for topic '${topicKey}'. ` +
                        `Allowed types: ${topicConfig.entityTypes.join(', ')}`);
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
            }
            catch (pgError) {
                new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.DATABASE_ERROR, 'Ошибка при создании записи в Postgres: не удалось создать запись о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError).throwAsHttpException('Global.OutboxInterceptor');
            }
            return res;
        }));
    }
};
OutboxInterceptor = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, InjectConnection()),
    __param(1, Optional()),
    __param(1, Inject(EXTERNAL_SEQUELIZE_TOKEN)),
    __param(3, Inject(OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [Sequelize,
        Sequelize,
        Reflector, Object])
], OutboxInterceptor);
export { OutboxInterceptor };
//# sourceMappingURL=outbox.interceptor.js.map