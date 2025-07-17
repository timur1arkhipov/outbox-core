import { Sequelize } from 'sequelize-typescript';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
export declare class OutboxMigrationService {
    private readonly config;
    sql: Record<string, string>;
    private readonly sequelize;
    private readonly schema;
    private readonly tableName;
    constructor(internalSequelize: Sequelize, externalSequelize: Sequelize, config: OutboxConfig);
    createOutboxTable(): Promise<void>;
    dropOutboxTable(): Promise<void>;
}
//# sourceMappingURL=outbox-migration.service.d.ts.map