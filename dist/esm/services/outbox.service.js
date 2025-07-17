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
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { OutboxDbService } from './outbox.db.service';
import { OutboxEventStatusEnum } from '../dto/outbox-event.dto';
import { OutboxProducerService } from './outbox-producer.service';
import { OutboxError, OutboxErrorCode, } from '../types/result.type';
import { OUTBOX_CONFIG } from '../constants';
let OutboxService = class OutboxService {
    constructor(dbService, kafkaProducer, config) {
        this.dbService = dbService;
        this.kafkaProducer = kafkaProducer;
        this.config = config;
    }
    getTopicConfigByEntityType(entityType) {
        for (const [topicKey, topicConfig] of Object.entries(this.config.topics)) {
            if (topicConfig.entityTypes.includes(entityType)) {
                return {
                    topicName: topicConfig.topicName,
                    processing: topicConfig.processing || this.config.defaultProcessing
                };
            }
        }
        const defaultTopic = this.config.topics['default'];
        if (defaultTopic) {
            return {
                topicName: defaultTopic.topicName,
                processing: defaultTopic.processing || this.config.defaultProcessing
            };
        }
        throw new Error(`No topic configuration found for entity type: ${entityType}`);
    }
    generateKafkaKey(msg) {
        return msg.entity_uuid;
    }
    groupEventsByKey(events) {
        const eventsByKey = new Map();
        for (const event of events) {
            const key = this.generateKafkaKey(event);
            if (!eventsByKey.has(key)) {
                eventsByKey.set(key, []);
            }
            eventsByKey.get(key).push(event);
        }
        return eventsByKey;
    }
    async receiveOutboxEventInfomodels(filters, transaction) {
        const outboxEvents = await this.dbService.selectOutboxEventsInfomodels(filters, transaction);
        if (outboxEvents._error) {
            return {
                data: null,
                _error: outboxEvents._error,
            };
        }
        return { data: outboxEvents.data, _error: null };
    }
    async selectBeforeOutboxEventsInfomodels(entity_uuids, transaction) {
        const outboxEvents = await this.dbService.selectBeforeOutboxEventsInfomodels(entity_uuids, transaction);
        if (outboxEvents._error) {
            return {
                data: null,
                _error: outboxEvents._error,
            };
        }
        return { data: outboxEvents.data, _error: null };
    }
    async updateOutboxEvents(uuid, data, transaction) {
        const { _error } = await this.dbService.updateOutboxEvent(uuid, data, transaction);
        if (_error) {
            return {
                data: null,
                _error,
            };
        }
        return { data: null, _error: null };
    }
    async produceMessage(payload, targetTopic) {
        try {
            let topic = targetTopic;
            if (!topic && payload.length > 0) {
                const firstEvent = payload[0];
                const entityType = firstEvent.entity_type || 'unknown';
                const topicConfig = this.getTopicConfigByEntityType(entityType);
                topic = topicConfig.topicName;
            }
            if (!topic) {
                topic = 'outbox-events';
            }
            await this.kafkaProducer.send({
                topic,
                messages: payload.map((msg) => {
                    const key = this.generateKafkaKey(msg);
                    const cleanPayload = { ...msg };
                    return {
                        value: JSON.stringify(cleanPayload),
                        key
                    };
                }),
            });
        }
        catch (error) {
            return {
                data: null,
                _error: new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.KAFKA_ERROR, 'Ошибка при отправке сообщений в Kafka', error instanceof Error ? error.stack : undefined, error),
            };
        }
        return {
            data: null,
            _error: null,
        };
    }
    async sendOutboxEventsInChunks(chunkSize) {
        const actualChunkSize = chunkSize || this.config.defaultProcessing.chunkSize;
        let totalProcessed = 0;
        let successChunks = 0;
        let failedChunks = 0;
        await this.cleanupStuckEventsInt();
        while (true) {
            const lockedEvents = await this.receiveOutboxEventInfomodels({
                status: [
                    OutboxEventStatusEnum.READY_TO_SEND,
                    OutboxEventStatusEnum.ERROR,
                ],
                with_lock: true,
                limit: actualChunkSize,
            });
            if (lockedEvents._error) {
                return {
                    data: null,
                    _error: lockedEvents._error,
                };
            }
            if (!lockedEvents.data?.length) {
                break;
            }
            const updateResult = await this.updateOutboxEvents(lockedEvents.data.map((event) => event.uuid), { status: OutboxEventStatusEnum.PROCESSING });
            if (updateResult._error) {
                return {
                    data: null,
                    _error: updateResult._error,
                };
            }
            const eventsByEntity = this.groupEventsByEntity(lockedEvents.data);
            const entityUUIDs = Array.from(eventsByEntity.keys());
            const beforeEvents = await this.selectBeforeOutboxEventsInfomodels(entityUUIDs);
            const chunk = Array.from(eventsByEntity.values()).flat();
            const result = await this.processEventChunkByTopics(chunk, beforeEvents.data ?? []);
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
    async processEventChunkByTopics(events, beforeEvents) {
        const eventsMsg = this.buildPayloadMsgForChunk(events, beforeEvents);
        if (!eventsMsg.length) {
            return { data: null, _error: null };
        }
        const eventsByTopic = new Map();
        for (const event of eventsMsg) {
            const entityType = event.entity_type || 'unknown';
            const topicConfig = this.getTopicConfigByEntityType(entityType);
            const topicName = topicConfig.topicName;
            if (!eventsByTopic.has(topicName)) {
                eventsByTopic.set(topicName, []);
            }
            eventsByTopic.get(topicName).push(event);
        }
        let hasErrors = false;
        for (const [topicName, topicEvents] of eventsByTopic) {
            const eventsByKey = this.groupEventsByKey(topicEvents);
            for (const [key, keyEvents] of eventsByKey) {
                const sendResult = await this.sendChunkWithRetry(keyEvents, 1, topicName);
                await this.updateOutboxEvents(keyEvents.map((e) => e.uuid), {
                    status: sendResult._error
                        ? OutboxEventStatusEnum.ERROR
                        : OutboxEventStatusEnum.SENT,
                });
                if (sendResult._error) {
                    hasErrors = true;
                }
            }
        }
        return {
            data: null,
            _error: hasErrors ? new OutboxError(HttpStatus.INTERNAL_SERVER_ERROR, OutboxErrorCode.KAFKA_ERROR, 'Some events failed to send') : null
        };
    }
    async sendChunkWithRetry(events, attempt = 1, targetTopic) {
        const result = await this.produceMessage(events, targetTopic);
        if (result._error && attempt < this.config.defaultProcessing.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, this.config.defaultProcessing.retryDelayMs * attempt));
            return this.sendChunkWithRetry(events, attempt + 1, targetTopic);
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
        await this.dbService.cleanupStuckEvents(this.config.defaultProcessing.processingTimeoutMinutes, this.config.defaultProcessing.maxRetries);
        return { data: null, _error: null };
    }
    async lockAndMarkEventsAsProcessing() {
        const eventsResult = await this.receiveOutboxEventInfomodels({
            status: [
                OutboxEventStatusEnum.READY_TO_SEND,
                OutboxEventStatusEnum.ERROR,
            ],
            with_lock: true,
        });
        if (eventsResult._error) {
            return eventsResult;
        }
        if (!eventsResult.data?.length) {
            return { data: [], _error: null };
        }
        const updateResult = await this.updateOutboxEvents(eventsResult.data.map((event) => event.uuid), { status: OutboxEventStatusEnum.PROCESSING });
        if (updateResult._error) {
            return {
                data: null,
                _error: updateResult._error,
            };
        }
        const updatedEvents = eventsResult.data.map((event) => ({
            ...event,
            status: OutboxEventStatusEnum.PROCESSING,
        }));
        return { data: updatedEvents, _error: null };
    }
    async cleanupStuckEvents() {
        const result = await this.dbService.cleanupStuckEvents(this.config.defaultProcessing.processingTimeoutMinutes, this.config.defaultProcessing.maxRetries);
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
OutboxService = __decorate([
    Injectable(),
    __param(2, Inject(OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [OutboxDbService,
        OutboxProducerService, Object])
], OutboxService);
export { OutboxService };
//# sourceMappingURL=outbox.service.js.map