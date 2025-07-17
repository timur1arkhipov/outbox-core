import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
export declare class OutboxInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly config;
    sql: Record<string, string>;
    private readonly sequelize;
    constructor(internalSequelize: Sequelize, externalSequelize: Sequelize, reflector: Reflector, config: OutboxConfig);
    intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>>;
}
//# sourceMappingURL=outbox.interceptor.d.ts.map