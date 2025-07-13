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
exports.OutboxEventMsgDto = exports.OutboxEventMsgPayload = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const outbox_event_dto_1 = require("./outbox-event.dto");
let OutboxEventMsgPayload = class OutboxEventMsgPayload {
};
exports.OutboxEventMsgPayload = OutboxEventMsgPayload;
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Не указан before события',
    }),
    (0, class_validator_1.ValidateNested)({
        each: true,
        message: 'Невалидные данные before события',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Данные before События',
        nullable: true,
        deprecated: false,
    }),
    __metadata("design:type", Object)
], OutboxEventMsgPayload.prototype, "before", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Не указан after события',
    }),
    (0, class_validator_1.ValidateNested)({
        each: true,
        message: 'Невалидные данные after события',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Данные after События',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Object)
], OutboxEventMsgPayload.prototype, "after", void 0);
exports.OutboxEventMsgPayload = OutboxEventMsgPayload = __decorate([
    (0, swagger_1.ApiSchema)({
        name: 'OutboxEventMsgPayload',
        description: 'Инфо модель payload События outbox для отправки в kafka',
    })
], OutboxEventMsgPayload);
let OutboxEventMsgDto = class OutboxEventMsgDto extends (0, swagger_1.OmitType)(outbox_event_dto_1.OutboxEventDto, [
    'payload',
]) {
};
exports.OutboxEventMsgDto = OutboxEventMsgDto;
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Не указан payload События',
    }),
    (0, class_validator_1.ValidateNested)({
        each: true,
        message: 'Невалидные данные События',
    }),
    (0, class_transformer_1.Type)(() => OutboxEventMsgPayload),
    (0, swagger_1.ApiProperty)({
        title: 'Данные Событий',
        description: 'Событие для отправки в kafka',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", OutboxEventMsgPayload)
], OutboxEventMsgDto.prototype, "payload", void 0);
exports.OutboxEventMsgDto = OutboxEventMsgDto = __decorate([
    (0, swagger_1.ApiSchema)({
        name: 'OutboxEventMsgDto',
        description: 'Инфо модель События outbox для отправки в kafka',
    })
], OutboxEventMsgDto);
//# sourceMappingURL=outbox-event-msg.dto.js.map