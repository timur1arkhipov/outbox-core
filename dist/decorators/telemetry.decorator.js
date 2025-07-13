"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxOperation = exports.WithTrace = exports.TELEMETRY_TRACE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.TELEMETRY_TRACE_KEY = 'TELEMETRY_TRACE';
// Простой декоратор для трейсинга
const WithTrace = (name, attributes) => {
    const config = {
        name,
        attributes,
        recordException: true,
        recordMetrics: false, // Только трейсы, без метрик
    };
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.TELEMETRY_TRACE_KEY, config));
};
exports.WithTrace = WithTrace;
// Специализированный декоратор для операций Outbox
const OutboxOperation = (operationName) => {
    const config = {
        name: `outbox.${operationName}`,
        attributes: {
            operation: operationName,
            component: 'outbox'
        },
        recordException: true,
        recordMetrics: true, // Включаем метрики для Outbox операций
    };
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.TELEMETRY_TRACE_KEY, config));
};
exports.OutboxOperation = OutboxOperation;
//# sourceMappingURL=telemetry.decorator.js.map