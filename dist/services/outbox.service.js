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
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("sequelize");
const outbox_db_service_1 = require("./outbox.db.service");
const outbox_event_filters_dto_1 = require("../dto/outbox-event-filters.dto");
const outbox_event_dto_1 = require("../dto/outbox-event.dto");
const update_outbox_event_dto_1 = require("../dto/update-outbox-event.dto");
const outbox_producer_service_1 = require("./outbox-producer.service");
const outbox_telemetry_service_1 = require("./outbox-telemetry.service");
const result_type_1 = require("../types/result.type");
const constants_1 = require("../constants");
const telemetry_decorator_1 = require("../decorators/telemetry.decorator");
let OutboxService = class OutboxService {
    constructor(dbService, kafkaProducer, config, telemetryService) {
        this.dbService = dbService;
        this.kafkaProducer = kafkaProducer;
        this.config = config;
        this.telemetryService = telemetryService;
        this.DEFAULT_CHUNK_SIZE = 100;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY_MS = 1000;
        this.PROCESSING_TIMEOUT_MINUTES = 5;
    }
    async receiveOutboxEventInfomodels(filters, transaction) {
        const outboxEvents = await this.dbService.selectOutboxEventsInfomodels(filters, transaction);
        if (outboxEvents._error) {
            return {
                data: null,
                _error: outboxEvents._error,
            };
        }
        return outboxEvents;
    }
    async selectBeforeOutboxEventsInfomodels(entity_uuids, transaction) {
        const outboxEvents = await this.dbService.selectBeforeOutboxEventsInfomodels(entity_uuids, transaction);
        if (outboxEvents._error) {
            return {
                data: null,
                _error: outboxEvents._error,
            };
        }
        return outboxEvents;
    }
    async updateOutboxEvents(uuid, data, transaction) {
        const actualOutboxEventModels = await this.receiveOutboxEventInfomodels({ uuid }, transaction);
        if (actualOutboxEventModels._error) {
            return {
                data: null,
                _error: actualOutboxEventModels._error,
            };
        }
        if (!actualOutboxEventModels.data?.length) {
            return {
                data: null,
                _error: new result_type_1.OutboxError(400, result_type_1.OutboxErrorCode.VALIDATION_ERROR, 'Нет событий для обновления'),
            };
        }
        const statusCheckError = this.checkStatus(actualOutboxEventModels.data, [
            outbox_event_dto_1.OutboxEventStatusEnum.SENT,
        ]);
        if (statusCheckError) {
            return {
                data: null,
                _error: statusCheckError,
            };
        }
        const updatedOutboxEvents = await this.dbService.updateOutboxEvent(uuid, data, transaction);
        if (updatedOutboxEvents._error) {
            return {
                data: null,
                _error: updatedOutboxEvents._error,
            };
        }
        return { data: null, _error: null };
    }
    async produceMessage(payload) {
        try {
            const topic = this.config.kafka?.topic || 'outbox-events';
            const startTime = Date.now();
            await this.kafkaProducer.send({
                topic,
                messages: payload.map((msg) => {
                    return { value: JSON.stringify(msg), key: msg.uuid };
                }),
            });
            if (this.telemetryService) {
                const duration = Date.now() - startTime;
                this.telemetryService.recordKafkaSendDuration(duration, topic, payload.length);
                this.telemetryService.recordKafkaMessage(topic, true);
            }
        }
        catch (error) {
            if (this.telemetryService) {
                const topic = this.config.kafka?.topic || 'outbox-events';
                this.telemetryService.recordKafkaMessage(topic, false);
            }
            return {
                data: null,
                _error: new result_type_1.OutboxError(500, result_type_1.OutboxErrorCode.KAFKA_ERROR, 'Ошибка при отправке сообщений в Kafka', error instanceof Error ? error.stack : undefined, error),
            };
        }
        return {
            data: null,
            _error: null,
        };
    }
    checkStatus(outboxEvents, forbiddenStatuses) {
        for (const event of outboxEvents) {
            if (forbiddenStatuses.includes(event.status)) {
                return new result_type_1.OutboxError(400, result_type_1.OutboxErrorCode.VALIDATION_ERROR, `Ошибка валидации: данное изменение невозможно для События ${event.uuid} в статусе ${event.status}`);
            }
        }
        return null;
    }
    async sendOutboxEventsInChunks(chunkSize) {
        const actualChunkSize = chunkSize || this.DEFAULT_CHUNK_SIZE;
        let totalProcessed = 0;
        let successChunks = 0;
        let failedChunks = 0;
        await this.cleanupStuckEventsInt();
        const lockedEvents = await this.lockAndMarkEventsAsProcessing();
        if (lockedEvents._error) {
            return {
                data: null,
                _error: lockedEvents._error,
            };
        }
        if (!lockedEvents.data?.length) {
            return {
                data: { totalProcessed: 0, successChunks: 0, failedChunks: 0 },
                _error: null,
            };
        }
        const eventsByEntity = this.groupEventsByEntity(lockedEvents.data);
        const entityUUIDs = Array.from(eventsByEntity.keys());
        const beforeEvents = await this.selectBeforeOutboxEventsInfomodels(entityUUIDs);
        const chunks = this.createChunksFromGroupedEvents(eventsByEntity, actualChunkSize);
        for (const chunk of chunks) {
            const result = await this.processEventChunk(chunk, beforeEvents.data ?? []);
            if (result._error) {
                failedChunks++;
            }
            else {
                successChunks++;
            }
            totalProcessed += chunk.length;
        }
        return {
            data: { totalProcessed, successChunks, failedChunks },
            _error: null,
        };
    }
    async processEventChunk(events, beforeEvents) {
        const eventsMsg = this.buildPayloadMsgForChunk(events, beforeEvents);
        if (!eventsMsg.length) {
            return { data: null, _error: null };
        }
        const sendResult = await this.sendChunkWithRetry(eventsMsg);
        await this.updateOutboxEvents(eventsMsg.map((e) => e.uuid), {
            status: sendResult._error
                ? outbox_event_dto_1.OutboxEventStatusEnum.ERROR
                : outbox_event_dto_1.OutboxEventStatusEnum.SENT,
        });
        return sendResult;
    }
    async sendChunkWithRetry(events, attempt = 1) {
        const result = await this.produceMessage(events);
        if (result._error && attempt < this.MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY_MS * attempt));
            return this.sendChunkWithRetry(events, attempt + 1);
        }
        return result;
    }
    groupEventsByEntity(events) {
        const grouped = new Map();
        for (const event of events) {
            const entityUUID = event.entity_uuid;
            if (!grouped.has(entityUUID)) {
                grouped.set(entityUUID, []);
            }
            grouped.get(entityUUID).push(event);
        }
        for (const [, eventList] of grouped) {
            this.sortEventsByDate(eventList);
        }
        return grouped;
    }
    createChunksFromGroupedEvents(eventsByEntity, chunkSize) {
        const chunks = [];
        let currentChunk = [];
        for (const [, events] of eventsByEntity) {
            for (const event of events) {
                currentChunk.push(event);
                if (currentChunk.length >= chunkSize) {
                    chunks.push([...currentChunk]);
                    currentChunk = [];
                }
            }
        }
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    buildPayloadMsgForChunk(events, beforeEvents) {
        const eventsMsg = [];
        const entityUUIDToBeforeEvents = new Map();
        for (const beforeEvent of beforeEvents) {
            entityUUIDToBeforeEvents.set(beforeEvent.entity_uuid, beforeEvent);
        }
        const groupedInChunk = new Map();
        for (const event of events) {
            const entityUUID = event.entity_uuid;
            if (!groupedInChunk.has(entityUUID)) {
                groupedInChunk.set(entityUUID, []);
            }
            groupedInChunk.get(entityUUID).push(event);
        }
        for (const [, eventList] of groupedInChunk) {
            this.sortEventsByDate(eventList);
        }
        for (const [entityUUID, entityEvents] of groupedInChunk) {
            entityEvents.forEach((event, index) => {
                let payload;
                if (event.type === 'CREATED') {
                    payload = { before: null, after: event.payload };
                    eventsMsg.push({ ...event, payload });
                    return;
                }
                if (index === 0) {
                    const foundBeforeEvent = entityUUIDToBeforeEvents.get(entityUUID);
                    payload = {
                        before: foundBeforeEvent?.payload || null,
                        after: event.payload,
                    };
                }
                else {
                    payload = {
                        before: entityEvents[index - 1].payload,
                        after: event.payload,
                    };
                }
                eventsMsg.push({ ...event, payload });
            });
        }
        return eventsMsg;
    }
    sortEventsByDate(events) {
        events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    async cleanupStuckEventsInt() {
        await this.dbService.cleanupStuckEvents(this.PROCESSING_TIMEOUT_MINUTES, this.MAX_RETRIES);
        return { data: null, _error: null };
    }
    async lockAndMarkEventsAsProcessing() {
        const eventsResult = await this.receiveOutboxEventInfomodels({
            status: [
                outbox_event_dto_1.OutboxEventStatusEnum.READY_TO_SEND,
                outbox_event_dto_1.OutboxEventStatusEnum.ERROR,
            ],
            with_lock: true,
        });
        if (eventsResult._error) {
            return eventsResult;
        }
        if (!eventsResult.data?.length) {
            return { data: [], _error: null };
        }
        const updateResult = await this.updateOutboxEvents(eventsResult.data.map((event) => event.uuid), { status: outbox_event_dto_1.OutboxEventStatusEnum.PROCESSING });
        if (updateResult._error) {
            return {
                data: null,
                _error: updateResult._error,
            };
        }
        const updatedEvents = eventsResult.data.map((event) => ({
            ...event,
            status: outbox_event_dto_1.OutboxEventStatusEnum.PROCESSING,
        }));
        return { data: updatedEvents, _error: null };
    }
    async cleanupStuckEvents() {
        const result = await this.dbService.cleanupStuckEvents(this.PROCESSING_TIMEOUT_MINUTES, this.MAX_RETRIES);
        if (result._error) {
            return {
                data: null,
                _error: result._error,
            };
        }
        return {
            data: result.data,
            _error: null,
        };
    }
};
exports.OutboxService = OutboxService;
__decorate([
    (0, telemetry_decorator_1.WithTrace)('outbox.receive_events', { operation: 'query' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [outbox_event_filters_dto_1.OutboxEventFiltersDto,
        sequelize_1.Transaction]),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "receiveOutboxEventInfomodels", null);
__decorate([
    (0, telemetry_decorator_1.WithTrace)('outbox.select_before_events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, sequelize_1.Transaction]),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "selectBeforeOutboxEventsInfomodels", null);
__decorate([
    (0, telemetry_decorator_1.WithTrace)('outbox.update_events', { operation: 'update' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, update_outbox_event_dto_1.UpdateOutboxEventDto,
        sequelize_1.Transaction]),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "updateOutboxEvents", null);
__decorate([
    (0, telemetry_decorator_1.OutboxOperation)('produce_message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "produceMessage", null);
__decorate([
    (0, telemetry_decorator_1.OutboxOperation)('send_chunks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "sendOutboxEventsInChunks", null);
__decorate([
    (0, telemetry_decorator_1.OutboxOperation)('cleanup_stuck_events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], OutboxService.prototype, "cleanupStuckEvents", null);
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(constants_1.OUTBOX_CONFIG)),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [outbox_db_service_1.OutboxDbService,
        outbox_producer_service_1.OutboxProducerService, Object, outbox_telemetry_service_1.OutboxTelemetryService])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map