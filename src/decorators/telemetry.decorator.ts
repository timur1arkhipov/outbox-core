import { SetMetadata, applyDecorators } from '@nestjs/common';

export const TELEMETRY_TRACE_KEY = 'TELEMETRY_TRACE';

export interface TraceConfig {
  name?: string;
  attributes?: Record<string, string | number | boolean>;
  recordException?: boolean;
  recordMetrics?: boolean;
}

// Простой декоратор для трейсинга
export const WithTrace = (name: string, attributes?: Record<string, string | number | boolean>) => {
  const config: TraceConfig = {
    name,
    attributes,
    recordException: true,
    recordMetrics: false, // Только трейсы, без метрик
  };

  return applyDecorators(
    SetMetadata(TELEMETRY_TRACE_KEY, config)
  );
};

// Специализированный декоратор для операций Outbox
export const OutboxOperation = (operationName: string) => {
  const config: TraceConfig = {
    name: `outbox.${operationName}`,
    attributes: { 
      operation: operationName,
      component: 'outbox'
    },
    recordException: true,
    recordMetrics: true, // Включаем метрики для Outbox операций
  };

  return applyDecorators(
    SetMetadata(TELEMETRY_TRACE_KEY, config)
  );
}; 