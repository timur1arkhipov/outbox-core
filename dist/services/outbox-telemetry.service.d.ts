import { OnModuleInit } from '@nestjs/common';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
interface Span {
    setStatus(status: any): void;
    recordException(exception: Error): void;
    end(): void;
    setAttributes(attributes: Record<string, string | number | boolean>): void;
}
export declare class OutboxTelemetryService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private meter?;
    private tracer?;
    private isEnabled;
    private initializationError?;
    private counters;
    private histograms;
    private gauges;
    constructor(config: OutboxConfig);
    onModuleInit(): void;
    private initializeTelemetry;
    private createDefaultMetrics;
    startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span;
    incrementCounter(name: string, attributes?: Record<string, string | number | boolean>, value?: number): void;
    recordHistogram(name: string, value: number, attributes?: Record<string, string | number | boolean>): void;
    updateGauge(name: string, value: number, attributes?: Record<string, string | number | boolean>): void;
    recordException(span: Span, error: Error): void;
    recordEventCreated(entityType: string, eventType: string): void;
    recordEventSent(entityType: string, eventType: string, retryCount?: number): void;
    recordEventFailed(entityType: string, eventType: string, errorType: string, retryCount?: number): void;
    recordKafkaMessage(topic: string, success: boolean): void;
    recordProcessingDuration(durationMs: number, entityType: string, eventCount: number): void;
    recordChunkProcessingDuration(durationMs: number, chunkSize: number, success: boolean): void;
    recordKafkaSendDuration(durationMs: number, topic: string, messageCount: number): void;
    updateQueueSize(delta: number, status: string): void;
    updateProcessingEvents(delta: number): void;
    updateStuckEvents(count: number): void;
    recordOperationSuccess(operationName: string, durationMs: number, attributes?: Record<string, string | number | boolean>): void;
    recordOperationError(operationName: string, durationMs: number, errorType: string, attributes?: Record<string, string | number | boolean>): void;
    measureAsync<T>(name: string, operation: () => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T>;
    private getOrCreateCounter;
    private getOrCreateHistogram;
    private getOrCreateGauge;
    private createNoOpSpan;
    get enabled(): boolean;
    get initError(): string | undefined;
    getStatus(): {
        enabled: boolean;
        error: string | undefined;
        config: {
            telemetryEnabled: boolean | undefined;
            tracingEnabled: boolean | undefined;
            metricsEnabled: boolean | undefined;
            serviceName: string | undefined;
        };
        providers: {
            hasTracer: boolean;
            hasMeter: boolean;
        };
    };
}
export {};
//# sourceMappingURL=outbox-telemetry.service.d.ts.map