import { OutboxConfig } from './interfaces/outbox-config.interface';

export const OUTBOX_CONFIG = 'OUTBOX_CONFIG';
export const EXTERNAL_SEQUELIZE_TOKEN = 'EXTERNAL_SEQUELIZE_TOKEN';
export const EXTERNAL_KAFKA_PRODUCER_TOKEN = 'EXTERNAL_KAFKA_PRODUCER_TOKEN';

export const DEFAULT_OUTBOX_CONFIG: OutboxConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'outbox',
    username: 'postgres',
    password: 'postgres',
    schema: 'public',
    tableName: 'outbox_events',
  },
  kafka: {
    brokers: ['localhost:9092'],
    topic: 'outbox-events',
    clientId: 'outbox-producer',
  },
  processing: {
    chunkSize: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
    processingTimeoutMinutes: 5,
  },
  telemetry: {
    enabled: true,
    serviceName: '@rolfcorp/nestjs-outbox',
    serviceVersion: '1.0.0',
    enableDefaultMetrics: true,
    enableTracing: true,
    enableMetrics: true,
  },
};
