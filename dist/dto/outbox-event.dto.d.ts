export declare enum OutboxEventStatusEnum {
    READY_TO_SEND = "READY_TO_SEND",
    PROCESSING = "PROCESSING",
    SENT = "SENT",
    ERROR = "ERROR"
}
export type PgOutboxEvent = {
    event_s_uuid: string;
    entity_uuid: string;
    entity_type: string;
    created_at: string;
    created_by: string;
    status: string;
    event_type: string;
    payload_as_json: Record<string, any>;
    retry_count?: number | null;
};
export declare class OutboxEventDto {
    uuid: string;
    entity_uuid: string;
    entity_type: string;
    created_at: string;
    user_login: string;
    status: OutboxEventStatusEnum;
    type: string;
    payload: Record<string, any>;
    retry_count?: number;
    static fromPgData(pgData: PgOutboxEvent): OutboxEventDto;
    static fromPgData(pgData: PgOutboxEvent[]): OutboxEventDto[];
    private static transformSingleEvent;
}
declare const OutboxEventLinkDto_base: import("@nestjs/common").Type<Partial<Pick<OutboxEventDto, "uuid">>>;
export declare class OutboxEventLinkDto extends OutboxEventLinkDto_base {
}
export {};
//# sourceMappingURL=outbox-event.dto.d.ts.map