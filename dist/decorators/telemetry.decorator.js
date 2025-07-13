"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxOperation = exports.WithTelemetry = exports.WithMetrics = exports.WithTrace = exports.TELEMETRY_METRICS_KEY = exports.TELEMETRY_TRACE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.TELEMETRY_TRACE_KEY = 'TELEMETRY_TRACE';
exports.TELEMETRY_METRICS_KEY = 'TELEMETRY_METRICS';
const WithTrace = (config = {}) => {
    const traceConfig = typeof config === 'string'
        ? { name: config }
        : config;
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.TELEMETRY_TRACE_KEY, traceConfig));
};
exports.WithTrace = WithTrace;
const WithMetrics = (config) => {
    return (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.TELEMETRY_METRICS_KEY, config));
};
exports.WithMetrics = WithMetrics;
const WithTelemetry = (traceConfig = {}, metricsConfig) => {
    const decorators = [(0, exports.WithTrace)(traceConfig)];
    if (metricsConfig) {
        decorators.push((0, exports.WithMetrics)(metricsConfig));
    }
    return (0, common_1.applyDecorators)(...decorators);
};
exports.WithTelemetry = WithTelemetry;
const OutboxOperation = (operationName) => {
    return (0, exports.WithTelemetry)({
        name: `outbox.${operationName}`,
        attributes: { operation: operationName },
        recordException: true,
        recordMetrics: true
    }, {
        counter: `outbox_${operationName}_total`,
        histogram: `outbox_${operationName}_duration_ms`,
        attributes: { operation: operationName }
    });
};
exports.OutboxOperation = OutboxOperation;
//# sourceMappingURL=telemetry.decorator.js.map