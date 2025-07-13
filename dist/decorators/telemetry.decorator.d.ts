export declare const TELEMETRY_TRACE_KEY = "TELEMETRY_TRACE";
export interface TraceConfig {
    name?: string;
    attributes?: Record<string, string | number | boolean>;
    recordException?: boolean;
    recordMetrics?: boolean;
}
export declare const WithTrace: (name: string, attributes?: Record<string, string | number | boolean>) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export declare const OutboxOperation: (operationName: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=telemetry.decorator.d.ts.map