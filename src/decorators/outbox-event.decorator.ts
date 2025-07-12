import { SetMetadata, applyDecorators } from '@nestjs/common';

const OUTBOX_EVENT_TYPE_KEY = 'OUTBOX_EVENT_TYPE';
const OUTBOX_ENTITY_TYPE_KEY = 'OUTBOX_ENTITY_TYPE';

export interface OutboxEventConfig {
  eventType: string;
  entityType: string;
}

export const OutboxEvent = (eventType: string, entityType: string) =>
  applyDecorators(
    SetMetadata(OUTBOX_EVENT_TYPE_KEY, eventType),
    SetMetadata(OUTBOX_ENTITY_TYPE_KEY, entityType),
  );

export { OUTBOX_EVENT_TYPE_KEY, OUTBOX_ENTITY_TYPE_KEY };
