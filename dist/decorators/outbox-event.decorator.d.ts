declare const OUTBOX_EVENT_TYPE_KEY = "OUTBOX_EVENT_TYPE";
declare const OUTBOX_ENTITY_TYPE_KEY = "OUTBOX_ENTITY_TYPE";
export interface OutboxEventConfig {
    eventType: string;
    entityType: string;
}
export declare const OutboxEvent: (eventType: string, entityType: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export { OUTBOX_EVENT_TYPE_KEY, OUTBOX_ENTITY_TYPE_KEY };
//# sourceMappingURL=outbox-event.decorator.d.ts.map