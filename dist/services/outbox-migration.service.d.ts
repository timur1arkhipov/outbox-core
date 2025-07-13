import { Sequelize } from 'sequelize-typescript';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
export declare class OutboxMigrationService {
    private readonly config;
    private readonly sequelize;
    private readonly schema;
    private readonly tableName;
    constructor(defaultSequelize: Sequelize, externalSequelize: Sequelize, config: OutboxConfig);
    createOutboxTable(): Promise<void>;
    dropOutboxTable(): Promise<void>;
    createTableIfNotExists(): Promise<void>;
    addEntityTypeColumnIfNotExists(): Promise<void>;
}
//# sourceMappingURL=outbox-migration.service.d.ts.map