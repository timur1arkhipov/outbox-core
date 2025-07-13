import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { OutboxTelemetryService } from '../services/outbox-telemetry.service';
export declare class TelemetryInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly telemetryService?;
    constructor(reflector: Reflector, telemetryService?: OutboxTelemetryService | undefined);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=telemetry.interceptor.d.ts.map