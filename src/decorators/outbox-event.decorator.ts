import { SetMetadata, applyDecorators } from '@nestjs/common';

export const OUTBOX_TOPIC_KEY = 'OUTBOX_TOPIC_KEY';
export const OUTBOX_EVENT_TYPE_KEY = 'OUTBOX_EVENT_TYPE';

export interface OutboxEventConfig {
  topicKey: string;
  eventType: string;
}

export const OutboxEvent = (
  topicKey: string, 
  eventType: string
) =>
  applyDecorators(
    SetMetadata(OUTBOX_TOPIC_KEY, topicKey),
    SetMetadata(OUTBOX_EVENT_TYPE_KEY, eventType),
  );
