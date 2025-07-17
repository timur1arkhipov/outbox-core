import { WORKDIR } from '../utils/const';
import { readFileSync } from 'fs';
export const sql_insertOutboxEvent = readFileSync(`${WORKDIR}/sql/InsertOutboxEvent.sql`).toString();
export const sql_createOutboxTable = readFileSync(`${WORKDIR}/sql/CreateOutboxTable.sql`).toString();
export const sql_dropOutboxTable = readFileSync(`${WORKDIR}/sql/DropOutboxTable.sql`).toString();
export const sql_selectOutboxEvents = readFileSync(`${WORKDIR}/sql/SelectOutboxEvents.sql`).toString();
export const sql_selectBeforeOutboxEvents = readFileSync(`${WORKDIR}/sql/SelectBeforeOutboxEvents.sql`).toString();
export const sql_cleanupStuckEventsReadyToSend = readFileSync(`${WORKDIR}/sql/CleanupStuckEventsReadyToSend.sql`).toString();
export const sql_cleanupStuckEventsError = readFileSync(`${WORKDIR}/sql/CleanupStuckEventsError.sql`).toString();
export const sql_updateOutboxEvent = readFileSync(`${WORKDIR}/sql/UpdateOutboxEvent.sql`).toString();
//# sourceMappingURL=index.js.map