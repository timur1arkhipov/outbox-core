import { OutboxEventDto } from './outbox-event.dto';
interface AgreementDto {
    [key: string]: any;
}
export declare class OutboxEventMsgPayload {
    before: AgreementDto | null;
    after: AgreementDto;
}
declare const OutboxEventMsgDto_base: import("@nestjs/common").Type<Omit<OutboxEventDto, "payload">>;
export declare class OutboxEventMsgDto extends OutboxEventMsgDto_base {
    payload: OutboxEventMsgPayload;
    uuid: string;
}
export {};
//# sourceMappingURL=outbox-event-msg.dto.d.ts.map