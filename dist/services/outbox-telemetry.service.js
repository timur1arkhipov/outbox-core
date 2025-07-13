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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxTelemetryService = void 0;
const common_1 = require("@nestjs/common");
let OutboxTelemetryService = class OutboxTelemetryService {
    constructor() {
        this.isEnabled = false;
        this.counters = new Map();
        this.histograms = new Map();
        this.gauges = new Map();
        this.initializeTelemetry();
    }
    onModuleInit() {
        if (this.isEnabled) {
            this.createDefaultMetrics();
        }
    }
    initializeTelemetry() {
        try {
            const otelApi = require('@opentelemetry/api');
            this.meter = otelApi.metrics.getMeter('@rolfcorp/nestjs-outbox', '1.0.0');
            this.tracer = otelApi.trace.getTracer('@rolfcorp/nestjs-outbox', '1.0.0');
            this.isEnabled = true;
        }
        catch (_error) {
            this.isEnabled = false;
        }
    }
    createDefaultMetrics() {
        if (!this.meter)
            return;
        this.getOrCreateCounter('outbox_events_created_total', 'Total number of outbox events created');
        this.getOrCreateCounter('outbox_events_sent_total', 'Total number of outbox events sent to Kafka');
        this.getOrCreateCounter('outbox_events_failed_total', 'Total number of failed outbox events');
        this.getOrCreateCounter('outbox_kafka_messages_total', 'Total number of Kafka messages sent');
        this.getOrCreateHistogram('outbox_processing_duration_ms', 'Duration of outbox event processing in milliseconds');
        this.getOrCreateHistogram('outbox_chunk_processing_duration_ms', 'Duration of chunk processing in milliseconds');
        this.getOrCreateHistogram('outbox_kafka_send_duration_ms', 'Duration of Kafka send operations in milliseconds');
        this.getOrCreateGauge('outbox_queue_size', 'Current number of events in outbox queue');
        this.getOrCreateGauge('outbox_processing_events', 'Current number of events being processed');
        this.getOrCreateGauge('outbox_stuck_events', 'Current number of stuck events');
    }
    startSpan(name, attributes) {
        if (!this.isEnabled || !this.tracer) {
            return this.createNoOpSpan();
        }
        const span = this.tracer.startSpan(name, { attributes });
        return span;
    }
    incrementCounter(name, attributes = {}, value = 1) {
        if (!this.isEnabled)
            return;
        const counter = this.getOrCreateCounter(name);
        if (counter) {
            counter.add(value, attributes);
        }
    }
    recordHistogram(name, value, attributes = {}) {
        if (!this.isEnabled)
            return;
        const histogram = this.getOrCreateHistogram(name);
        if (histogram) {
            histogram.record(value, attributes);
        }
    }
    updateGauge(name, value, attributes = {}) {
        if (!this.isEnabled)
            return;
        const gauge = this.getOrCreateGauge(name);
        if (gauge) {
            gauge.add(value, attributes);
        }
    }
    recordException(span, error) {
        if (!this.isEnabled || !span)
            return;
        span.recordException(error);
    }
    recordEventCreated(entityType, eventType) {
        this.incrementCounter('outbox_events_created_total', {
            entity_type: entityType,
            event_type: eventType,
        });
    }
    recordEventSent(entityType, eventType, retryCount = 0) {
        this.incrementCounter('outbox_events_sent_total', {
            entity_type: entityType,
            event_type: eventType,
            retry_count: retryCount.toString(),
        });
    }
    recordEventFailed(entityType, eventType, errorType, retryCount = 0) {
        this.incrementCounter('outbox_events_failed_total', {
            entity_type: entityType,
            event_type: eventType,
            error_type: errorType,
            retry_count: retryCount.toString(),
        });
    }
    recordKafkaMessage(topic, success) {
        this.incrementCounter('outbox_kafka_messages_total', {
            topic,
            status: success ? 'success' : 'failure',
        });
    }
    recordProcessingDuration(durationMs, entityType, eventCount) {
        this.recordHistogram('outbox_processing_duration_ms', durationMs, {
            entity_type: entityType,
            event_count: eventCount.toString(),
        });
    }
    recordChunkProcessingDuration(durationMs, chunkSize, success) {
        this.recordHistogram('outbox_chunk_processing_duration_ms', durationMs, {
            chunk_size: chunkSize.toString(),
            status: success ? 'success' : 'failure',
        });
    }
    recordKafkaSendDuration(durationMs, topic, messageCount) {
        this.recordHistogram('outbox_kafka_send_duration_ms', durationMs, {
            topic,
            message_count: messageCount.toString(),
        });
    }
    updateQueueSize(delta, status) {
        this.updateGauge('outbox_queue_size', delta, { status });
    }
    updateProcessingEvents(delta) {
        this.updateGauge('outbox_processing_events', delta);
    }
    updateStuckEvents(count) {
        this.updateGauge('outbox_stuck_events', count, { type: 'stuck' });
    }
    recordOperationSuccess(operationName, durationMs, attributes = {}) {
        this.incrementCounter(`${operationName}_total`, { ...attributes, status: 'success' });
        this.recordHistogram(`${operationName}_duration_ms`, durationMs, { ...attributes, status: 'success' });
    }
    recordOperationError(operationName, durationMs, errorType, attributes = {}) {
        this.incrementCounter(`${operationName}_total`, { ...attributes, status: 'error', error_type: errorType });
        this.recordHistogram(`${operationName}_duration_ms`, durationMs, { ...attributes, status: 'error' });
    }
    async measureAsync(name, operation, attributes) {
        const span = this.startSpan(name, attributes);
        const startTime = Date.now();
        try {
            const result = await operation();
            span.setStatus({ code: 1 }); // OK
            return result;
        }
        catch (error) {
            this.recordException(span, error);
            span.setStatus({ code: 2, message: error.message }); // ERROR
            throw error;
        }
        finally {
            const duration = Date.now() - startTime;
            this.recordHistogram(`${name}_duration_ms`, duration, attributes || {});
            span.end();
        }
    }
    getOrCreateCounter(name, description) {
        if (!this.meter)
            return null;
        if (!this.counters.has(name)) {
            const counter = this.meter.createCounter(name, { description });
            this.counters.set(name, counter);
        }
        return this.counters.get(name);
    }
    getOrCreateHistogram(name, description) {
        if (!this.meter)
            return null;
        if (!this.histograms.has(name)) {
            const histogram = this.meter.createHistogram(name, { description, unit: 'ms' });
            this.histograms.set(name, histogram);
        }
        return this.histograms.get(name);
    }
    getOrCreateGauge(name, description) {
        if (!this.meter)
            return null;
        if (!this.gauges.has(name)) {
            const gauge = this.meter.createUpDownCounter(name, { description });
            this.gauges.set(name, gauge);
        }
        return this.gauges.get(name);
    }
    createNoOpSpan() {
        return {
            setStatus: () => { },
            recordException: () => { },
            end: () => { },
            setAttributes: () => { },
        };
    }
    get enabled() {
        return this.isEnabled;
    }
};
exports.OutboxTelemetryService = OutboxTelemetryService;
exports.OutboxTelemetryService = OutboxTelemetryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OutboxTelemetryService);
//# sourceMappingURL=outbox-telemetry.service.js.map