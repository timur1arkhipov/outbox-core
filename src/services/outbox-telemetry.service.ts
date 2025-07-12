import { Injectable, OnModuleInit } from '@nestjs/common';

interface Meter {
  createCounter(name: string, options?: any): any;
  createHistogram(name: string, options?: any): any;
  createUpDownCounter(name: string, options?: any): any;
  createObservableGauge(name: string, options?: any): any;
}

interface Tracer {
  startSpan(name: string, options?: any): any;
}

interface Span {
  setStatus(status: any): void;
  recordException(exception: Error): void;
  end(): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
}

@Injectable()
export class OutboxTelemetryService implements OnModuleInit {
  private meter?: Meter;
  private tracer?: Tracer;
  private isEnabled = false;

  private counters = new Map<string, any>();
  private histograms = new Map<string, any>();
  private gauges = new Map<string, any>();

  constructor() {
    this.initializeTelemetry();
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.createDefaultMetrics();
    }
  }

  private initializeTelemetry() {
    try {
      const otelApi = require('@opentelemetry/api');
      this.meter = otelApi.metrics.getMeter('@rolfcorp/nestjs-outbox', '1.0.0');
      this.tracer = otelApi.trace.getTracer('@rolfcorp/nestjs-outbox', '1.0.0');
      this.isEnabled = true;
    } catch (_error) {
      this.isEnabled = false;
    }
  }

  private createDefaultMetrics() {
    if (!this.meter) return;

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

  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    if (!this.isEnabled || !this.tracer) {
      return this.createNoOpSpan();
    }

    const span = this.tracer.startSpan(name, { attributes });
    return span;
  }

  incrementCounter(name: string, attributes: Record<string, string | number | boolean> = {}, value = 1) {
    if (!this.isEnabled) return;

    const counter = this.getOrCreateCounter(name);
    if (counter) {
      counter.add(value, attributes);
    }
  }

  recordHistogram(name: string, value: number, attributes: Record<string, string | number | boolean> = {}) {
    if (!this.isEnabled) return;

    const histogram = this.getOrCreateHistogram(name);
    if (histogram) {
      histogram.record(value, attributes);
    }
  }

  updateGauge(name: string, value: number, attributes: Record<string, string | number | boolean> = {}) {
    if (!this.isEnabled) return;

    const gauge = this.getOrCreateGauge(name);
    if (gauge) {
      gauge.add(value, attributes);
    }
  }

  recordException(span: Span, error: Error) {
    if (!this.isEnabled || !span) return;

    span.recordException(error);
  }

  recordEventCreated(entityType: string, eventType: string) {
    this.incrementCounter('outbox_events_created_total', {
      entity_type: entityType,
      event_type: eventType,
    });
  }

  recordEventSent(entityType: string, eventType: string, retryCount: number = 0) {
    this.incrementCounter('outbox_events_sent_total', {
      entity_type: entityType,
      event_type: eventType,
      retry_count: retryCount.toString(),
    });
  }

  recordEventFailed(entityType: string, eventType: string, errorType: string, retryCount: number = 0) {
    this.incrementCounter('outbox_events_failed_total', {
      entity_type: entityType,
      event_type: eventType,
      error_type: errorType,
      retry_count: retryCount.toString(),
    });
  }

  recordKafkaMessage(topic: string, success: boolean) {
    this.incrementCounter('outbox_kafka_messages_total', {
      topic,
      status: success ? 'success' : 'failure',
    });
  }

  recordProcessingDuration(durationMs: number, entityType: string, eventCount: number) {
    this.recordHistogram('outbox_processing_duration_ms', durationMs, {
      entity_type: entityType,
      event_count: eventCount.toString(),
    });
  }

  recordChunkProcessingDuration(durationMs: number, chunkSize: number, success: boolean) {
    this.recordHistogram('outbox_chunk_processing_duration_ms', durationMs, {
      chunk_size: chunkSize.toString(),
      status: success ? 'success' : 'failure',
    });
  }

  recordKafkaSendDuration(durationMs: number, topic: string, messageCount: number) {
    this.recordHistogram('outbox_kafka_send_duration_ms', durationMs, {
      topic,
      message_count: messageCount.toString(),
    });
  }

  updateQueueSize(delta: number, status: string) {
    this.updateGauge('outbox_queue_size', delta, { status });
  }

  updateProcessingEvents(delta: number) {
    this.updateGauge('outbox_processing_events', delta);
  }

  updateStuckEvents(count: number) {
    this.updateGauge('outbox_stuck_events', count, { type: 'stuck' });
  }

  recordOperationSuccess(operationName: string, durationMs: number, attributes: Record<string, string | number | boolean> = {}) {
    this.incrementCounter(`${operationName}_total`, { ...attributes, status: 'success' });
    this.recordHistogram(`${operationName}_duration_ms`, durationMs, { ...attributes, status: 'success' });
  }

  recordOperationError(operationName: string, durationMs: number, errorType: string, attributes: Record<string, string | number | boolean> = {}) {
    this.incrementCounter(`${operationName}_total`, { ...attributes, status: 'error', error_type: errorType });
    this.recordHistogram(`${operationName}_duration_ms`, durationMs, { ...attributes, status: 'error' });
  }

  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    const startTime = Date.now();

    try {
      const result = await operation();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      this.recordException(span, error as Error);
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.recordHistogram(`${name}_duration_ms`, duration, attributes || {});
      span.end();
    }
  }

  private getOrCreateCounter(name: string, description?: string) {
    if (!this.meter) return null;

    if (!this.counters.has(name)) {
      const counter = this.meter.createCounter(name, { description });
      this.counters.set(name, counter);
    }
    return this.counters.get(name);
  }

  private getOrCreateHistogram(name: string, description?: string) {
    if (!this.meter) return null;

    if (!this.histograms.has(name)) {
      const histogram = this.meter.createHistogram(name, { description, unit: 'ms' });
      this.histograms.set(name, histogram);
    }
    return this.histograms.get(name);
  }

  private getOrCreateGauge(name: string, description?: string) {
    if (!this.meter) return null;

    if (!this.gauges.has(name)) {
      const gauge = this.meter.createUpDownCounter(name, { description });
      this.gauges.set(name, gauge);
    }
    return this.gauges.get(name);
  }

  private createNoOpSpan(): Span {
    return {
      setStatus: () => {},
      recordException: () => {},
      end: () => {},
      setAttributes: () => {},
    };
  }

  get enabled(): boolean {
    return this.isEnabled;
  }
} 