export declare const OUTBOX_TOPIC_KEY = "OUTBOX_TOPIC_KEY";
export declare const OUTBOX_EVENT_TYPE_KEY = "OUTBOX_EVENT_TYPE";
export interface OutboxEventConfig {
    topicKey: string;
    eventType: string;
}
export declare const OutboxEvent: (topicKey: string, eventType: string) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=outbox-event.decorator.d.ts.map