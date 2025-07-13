export declare const TELEMETRY_TRACE_KEY = "TELEMETRY_TRACE";
export declare const TELEMETRY_METRICS_KEY = "TELEMETRY_METRICS";
export interface TraceConfig {
    name?: string;
    attributes?: Record<string, string | number | boolean>;
    recordException?: boolean;
    recordMetrics?: boolean;
}
export interface MetricsConfig {
    counter?: string;
    histogram?: string;
    gauge?: string;
    attributes?: Record<string, string | number | boolean>;
}
export declare const WithTrace: (config?: TraceConfig | string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const WithMetrics: (config: MetricsConfig) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const WithTelemetry: (traceConfig?: TraceConfig | string, metricsConfig?: MetricsConfig) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const OutboxOperation: (operationName: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=telemetry.decorator.d.ts.map