export interface OutboxEventData {
    uuid: string;
    agreement: string;
    created_at: string;
    user_login: string;
    status: string;
    type: string;
    payload: Record<string, any>;
    retry_count?: number;
}
export interface OutboxEventMessage {
    uuid: string;
    eventType: string;
    agreementUUID: string;
    eventDate: string;
    userName: string;
    payload: OutboxEventMessagePayload;
}
export interface OutboxEventMessagePayload {
    before?: Record<string, any>;
    after: Record<string, any>;
}
//# sourceMappingURL=outbox-event.interface.d.ts.map