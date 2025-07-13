import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OutboxTelemetryService } from '../services/outbox-telemetry.service';
export declare class OutboxInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly config;
    private readonly telemetryService?;
    sql: Record<string, string>;
    private readonly sequelize;
    constructor(defaultSequelize: Sequelize, externalSequelize: Sequelize, reflector: Reflector, config: OutboxConfig, telemetryService?: OutboxTelemetryService | undefined);
    private replaceTablePlaceholders;
    intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>>;
}
//# sourceMappingURL=outbox.interceptor.d.ts.map