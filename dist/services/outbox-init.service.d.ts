import { OnModuleInit } from '@nestjs/common';
import { OutboxMigrationService } from './outbox-migration.service';
export declare class OutboxInitService implements OnModuleInit {
    private readonly outboxMigration;
    private readonly logger;
    constructor(outboxMigration: OutboxMigrationService);
    onModuleInit(): Promise<void>;
}
//# sourceMappingURL=outbox-init.service.d.ts.map