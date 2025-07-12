import { SetMetadata, applyDecorators } from '@nestjs/common';

export const TELEMETRY_TRACE_KEY = 'TELEMETRY_TRACE';
export const TELEMETRY_METRICS_KEY = 'TELEMETRY_METRICS';

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

export const WithTrace = (config: TraceConfig | string = {}) => {
  const traceConfig: TraceConfig = typeof config === 'string' 
    ? { name: config } 
    : config;

  return applyDecorators(
    SetMetadata(TELEMETRY_TRACE_KEY, traceConfig)
  );
};

export const WithMetrics = (config: MetricsConfig) => {
  return applyDecorators(
    SetMetadata(TELEMETRY_METRICS_KEY, config)
  );
};

export const WithTelemetry = (
  traceConfig: TraceConfig | string = {},
  metricsConfig?: MetricsConfig
) => {
  const decorators = [WithTrace(traceConfig)];
  
  if (metricsConfig) {
    decorators.push(WithMetrics(metricsConfig));
  }
  
  return applyDecorators(...decorators);
};

export const OutboxOperation = (operationName: string) => {
  return WithTelemetry(
    {
      name: `outbox.${operationName}`,
      attributes: { operation: operationName },
      recordException: true,
      recordMetrics: true
    },
    {
      counter: `outbox_${operationName}_total`,
      histogram: `outbox_${operationName}_duration_ms`,
      attributes: { operation: operationName }
    }
  );
}; 