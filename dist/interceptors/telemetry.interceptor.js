"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const telemetry_decorator_1 = require("../decorators/telemetry.decorator");
const outbox_telemetry_service_1 = require("../services/outbox-telemetry.service");
let TelemetryInterceptor = class TelemetryInterceptor {
    constructor(reflector, telemetryService) {
        this.reflector = reflector;
        this.telemetryService = telemetryService;
    }
    intercept(context, next) {
        if (!this.telemetryService) {
            return next.handle();
        }
        const traceConfig = this.reflector.getAllAndOverride(telemetry_decorator_1.TELEMETRY_TRACE_KEY, [context.getHandler(), context.getClass()]);
        if (!traceConfig) {
            return next.handle();
        }
        const methodName = context.getHandler().name;
        const className = context.getClass().name;
        const operationName = traceConfig.name || `${className}.${methodName}`;
        const startTime = Date.now();
        const span = this.telemetryService.startSpan(operationName, {
            class: className,
            method: methodName,
            ...traceConfig.attributes,
        });
        return next.handle().pipe((0, rxjs_1.tap)((result) => {
            const duration = Date.now() - startTime;
            if (traceConfig.recordMetrics && this.telemetryService) {
                this.telemetryService.recordOperationSuccess(operationName, duration, traceConfig.attributes || {});
            }
            span.setStatus({ code: 1 }); // OK
            span.end();
        }), (0, rxjs_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            if (traceConfig.recordException && this.telemetryService) {
                this.telemetryService.recordException(span, error);
            }
            if (traceConfig.recordMetrics && this.telemetryService) {
                this.telemetryService.recordOperationError(operationName, duration, error.constructor.name, traceConfig.attributes || {});
            }
            span.setStatus({
                code: 2, // ERROR
                message: error.message
            });
            span.end();
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
};
exports.TelemetryInterceptor = TelemetryInterceptor;
exports.TelemetryInterceptor = TelemetryInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [core_1.Reflector,
        outbox_telemetry_service_1.OutboxTelemetryService])
], TelemetryInterceptor);
//# sourceMappingURL=telemetry.interceptor.js.map