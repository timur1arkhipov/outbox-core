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
exports.OutboxInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const outbox_event_dto_1 = require("../dto/outbox-event.dto");
const sequelize_2 = require("sequelize");
const result_type_1 = require("../types/result.type");
const outbox_event_decorator_1 = require("../decorators/outbox-event.decorator");
const constants_1 = require("../constants");
const outbox_telemetry_service_1 = require("../services/outbox-telemetry.service");
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
let OutboxInterceptor = class OutboxInterceptor {
    constructor(defaultSequelize, externalSequelize, reflector, config, telemetryService) {
        this.reflector = reflector;
        this.config = config;
        this.telemetryService = telemetryService;
        this.sequelize = externalSequelize || defaultSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided.');
        }
        this.sql = {
            insertOutboxEvent: this.replaceTablePlaceholders(SQL_INSERT_OUTBOX_EVENT),
        };
    }
    replaceTablePlaceholders(sql) {
        const schema = this.config.database?.schema || 'public';
        const tableName = this.config.database?.tableName || 'outbox_events';
        return sql.replace(/:schema/g, schema).replace(/:table/g, tableName);
    }
    async intercept(context, next) {
        const eventType = this.reflector.getAllAndOverride(outbox_event_decorator_1.OUTBOX_EVENT_TYPE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const entityType = this.reflector.getAllAndOverride(outbox_event_decorator_1.OUTBOX_ENTITY_TYPE_KEY, [context.getHandler(), context.getClass()]);
        if (!eventType || !entityType) {
            return next.handle();
        }
        return next.handle().pipe((0, rxjs_1.mergeMap)(async (res) => {
            if (!res.data) {
                return res;
            }
            const data = Array.isArray(res.data) ? res.data : [res.data];
            const request = context.switchToHttp().getRequest();
            const user = request.userInfo || { username: 'system' };
            let transaction = request.transaction;
            if (transaction) {
                if (transaction.finished) {
                    transaction = undefined;
                }
                for (const item of data) {
                    if (!item.uuid) {
                        throw new result_type_1.OutboxError(400, result_type_1.OutboxErrorCode.VALIDATION_ERROR, 'Outbox event requires uuid field in returned data object');
                    }
                }
                const outboxEventValues = [];
                const baseTime = Date.now();
                data.forEach((item, index) => {
                    const eventDate = new Date(baseTime + index);
                    outboxEventValues.push(item.uuid, entityType, eventDate.toISOString(), user.username, outbox_event_dto_1.OutboxEventStatusEnum.READY_TO_SEND, eventType, JSON.stringify(item));
                });
                const valuesPerRow = 7;
                const valuesClauses = data.map((_, index) => {
                    const startIndex = index * valuesPerRow + 1;
                    const placeholders = Array.from({ length: valuesPerRow }, (_, i) => `$${startIndex + i}`).join(', ');
                    return `(${placeholders})`;
                }).join(', ');
                const fullSql = `${this.sql.insertOutboxEvent} ${valuesClauses}`;
                try {
                    await this.sequelize.query(fullSql, {
                        bind: outboxEventValues,
                        transaction,
                        type: sequelize_2.QueryTypes.INSERT,
                    });
                    if (this.telemetryService) {
                        data.forEach(() => {
                            this.telemetryService.recordEventCreated(entityType, eventType);
                        });
                    }
                }
                catch (pgError) {
                    const error = new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.DATABASE_ERROR, 'Ошибка при создании записи в Postgres: не удалось создать запись о Событии outbox', pgError instanceof Error ? pgError.stack : undefined, pgError);
                    error.throwAsHttpException('Global.OutboxInterceptor');
                }
            }
            return res;
        }));
    }
};
exports.OutboxInterceptor = OutboxInterceptor;
exports.OutboxInterceptor = OutboxInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, sequelize_1.InjectConnection)()),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.EXTERNAL_SEQUELIZE_TOKEN)),
    __param(3, (0, common_1.Inject)(constants_1.OUTBOX_CONFIG)),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize,
        sequelize_typescript_1.Sequelize,
        core_1.Reflector, Object, outbox_telemetry_service_1.OutboxTelemetryService])
], OutboxInterceptor);
//# sourceMappingURL=outbox.interceptor.js.map