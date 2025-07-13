"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOutboxEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const outbox_event_dto_1 = require("./outbox-event.dto");
let UpdateOutboxEventDto = class UpdateOutboxEventDto {
};
exports.UpdateOutboxEventDto = UpdateOutboxEventDto;
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Остутствует Статус События',
    }),
    (0, class_validator_1.IsEnum)(outbox_event_dto_1.OutboxEventStatusEnum, {
        message: 'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Статус События',
        enum: outbox_event_dto_1.OutboxEventStatusEnum,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], UpdateOutboxEventDto.prototype, "status", void 0);
exports.UpdateOutboxEventDto = UpdateOutboxEventDto = __decorate([
    (0, swagger_1.ApiSchema)({
        name: 'UpdateOutboxEvent',
        description: 'Схема, описывающая данные, которые необходимо передать для обновления События outbox',
    })
], UpdateOutboxEventDto);
//# sourceMappingURL=update-outbox-event.dto.js.map