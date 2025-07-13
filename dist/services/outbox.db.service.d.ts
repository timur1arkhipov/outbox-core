import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { UpdateOutboxEventDto } from '../dto/update-outbox-event.dto';
import { OutboxEventDto } from '../dto/outbox-event.dto';
import { OutboxEventFiltersDto } from '../dto/outbox-event-filters.dto';
import { CleanupResultDto } from '../dto/cleanup-result.dto';
import { PromiseWithError } from '../types/result.type';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
export declare class OutboxDbService {
    private readonly config;
    sql: Record<string, string>;
    private sequelize;
    constructor(defaultSequelize: Sequelize, externalSequelize: Sequelize, config: OutboxConfig);
    private replaceTablePlaceholders;
    updateOutboxEvent(uuids: string[], data: UpdateOutboxEventDto, transaction?: Transaction): PromiseWithError<void>;
    selectOutboxEventsInfomodels(filters: OutboxEventFiltersDto, transaction?: Transaction): PromiseWithError<OutboxEventDto[]>;
    selectBeforeOutboxEventsInfomodels(entity_uuids: string[], transaction?: Transaction): PromiseWithError<OutboxEventDto[]>;
    cleanupStuckEvents(timeoutMinutes?: number, maxRetries?: number, transaction?: Transaction): PromiseWithError<CleanupResultDto>;
}
//# sourceMappingURL=outbox.db.service.d.ts.map