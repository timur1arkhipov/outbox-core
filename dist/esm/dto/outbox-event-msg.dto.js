var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiSchema, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { OutboxEventDto } from './outbox-event.dto';
let OutboxEventMsgPayload = class OutboxEventMsgPayload {
};
__decorate([
    IsDefined({
        message: 'Не указан before события',
    }),
    ValidateNested({
        each: true,
        message: 'Невалидные данные before события',
    }),
    ApiProperty({
        title: 'Данные before События',
        nullable: true,
        deprecated: false,
    }),
    __metadata("design:type", Object)
], OutboxEventMsgPayload.prototype, "before", void 0);
__decorate([
    IsDefined({
        message: 'Не указан after события',
    }),
    ValidateNested({
        each: true,
        message: 'Невалидные данные after события',
    }),
    ApiProperty({
        title: 'Данные after События',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Object)
], OutboxEventMsgPayload.prototype, "after", void 0);
OutboxEventMsgPayload = __decorate([
    ApiSchema({
        name: 'OutboxEventMsgPayload',
        description: 'Инфо модель payload События outbox для отправки в kafka',
    })
], OutboxEventMsgPayload);
export { OutboxEventMsgPayload };
let OutboxEventMsgDto = class OutboxEventMsgDto extends OmitType(OutboxEventDto, [
    'payload',
]) {
};
__decorate([
    IsDefined({
        message: 'Не указан payload События',
    }),
    ValidateNested({
        each: true,
        message: 'Невалидные данные События',
    }),
    Type(() => OutboxEventMsgPayload),
    ApiProperty({
        title: 'Данные Событий',
        description: 'Событие для отправки в kafka',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", OutboxEventMsgPayload)
], OutboxEventMsgDto.prototype, "payload", void 0);
OutboxEventMsgDto = __decorate([
    ApiSchema({
        name: 'OutboxEventMsgDto',
        description: 'Инфо модель События outbox для отправки в kafka',
    })
], OutboxEventMsgDto);
export { OutboxEventMsgDto };
//# sourceMappingURL=outbox-event-msg.dto.js.map