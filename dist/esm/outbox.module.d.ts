import { DynamicModule } from '@nestjs/common';
import { OutboxConfig, OutboxModuleAsyncOptions } from './interfaces/outbox-config.interface';
export declare class OutboxModule {
    static forRoot(config: Partial<OutboxConfig>): DynamicModule;
    static forRootAsync(options: OutboxModuleAsyncOptions): DynamicModule;
    private static mergeWithDefaults;
}
//# sourceMappingURL=outbox.module.d.ts.map