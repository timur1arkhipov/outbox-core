"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTBOX_ENTITY_TYPE_KEY = exports.OUTBOX_EVENT_TYPE_KEY = exports.OutboxEvent = void 0;
const common_1 = require("@nestjs/common");
const OUTBOX_EVENT_TYPE_KEY = 'OUTBOX_EVENT_TYPE';
exports.OUTBOX_EVENT_TYPE_KEY = OUTBOX_EVENT_TYPE_KEY;
const OUTBOX_ENTITY_TYPE_KEY = 'OUTBOX_ENTITY_TYPE';
exports.OUTBOX_ENTITY_TYPE_KEY = OUTBOX_ENTITY_TYPE_KEY;
const OutboxEvent = (eventType, entityType) => (0, common_1.applyDecorators)((0, common_1.SetMetadata)(OUTBOX_EVENT_TYPE_KEY, eventType), (0, common_1.SetMetadata)(OUTBOX_ENTITY_TYPE_KEY, entityType));
exports.OutboxEvent = OutboxEvent;
//# sourceMappingURL=outbox-event.decorator.js.map