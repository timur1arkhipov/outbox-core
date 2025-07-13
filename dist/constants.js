"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OUTBOX_CONFIG = exports.EXTERNAL_KAFKA_PRODUCER_TOKEN = exports.EXTERNAL_SEQUELIZE_TOKEN = exports.OUTBOX_CONFIG = void 0;
exports.OUTBOX_CONFIG = 'OUTBOX_CONFIG';
exports.EXTERNAL_SEQUELIZE_TOKEN = 'EXTERNAL_SEQUELIZE_TOKEN';
exports.EXTERNAL_KAFKA_PRODUCER_TOKEN = 'EXTERNAL_KAFKA_PRODUCER_TOKEN';
exports.DEFAULT_OUTBOX_CONFIG = {
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
//# sourceMappingURL=constants.js.map