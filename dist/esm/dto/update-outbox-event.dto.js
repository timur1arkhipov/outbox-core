var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsDefined } from 'class-validator';
import { OutboxEventStatusEnum } from './outbox-event.dto';
let UpdateOutboxEventDto = class UpdateOutboxEventDto {
};
__decorate([
    IsDefined({
        message: 'Остутствует Статус События',
    }),
    IsEnum(OutboxEventStatusEnum, {
        message: 'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
    }),
    ApiProperty({
        title: 'Статус События',
        enum: OutboxEventStatusEnum,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], UpdateOutboxEventDto.prototype, "status", void 0);
UpdateOutboxEventDto = __decorate([
    ApiSchema({
        name: 'UpdateOutboxEvent',
        description: 'Схема, описывающая данные, которые необходимо передать для обновления События outbox',
    })
], UpdateOutboxEventDto);
export { UpdateOutboxEventDto };
//# sourceMappingURL=update-outbox-event.dto.js.map