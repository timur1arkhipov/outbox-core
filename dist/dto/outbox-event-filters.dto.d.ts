import { OutboxEventStatusEnum } from './outbox-event.dto';
export declare class EntityLinkDto {
    uuid: string;
}
export declare class OutboxEventFiltersDto {
    uuid?: string[];
    entities?: EntityLinkDto[];
    entity_types?: string[];
    status?: OutboxEventStatusEnum[];
    with_lock?: boolean;
}
export declare class OutboxEventFiltersBodyDto {
    data: OutboxEventFiltersDto;
}
//# sourceMappingURL=outbox-event-filters.dto.d.ts.map