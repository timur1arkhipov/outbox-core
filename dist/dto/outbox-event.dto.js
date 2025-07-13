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
var OutboxEventDto_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxEventLinkDto = exports.OutboxEventDto = exports.OutboxEventStatusEnum = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var OutboxEventStatusEnum;
(function (OutboxEventStatusEnum) {
    OutboxEventStatusEnum["READY_TO_SEND"] = "READY_TO_SEND";
    OutboxEventStatusEnum["PROCESSING"] = "PROCESSING";
    OutboxEventStatusEnum["SENT"] = "SENT";
    OutboxEventStatusEnum["ERROR"] = "ERROR";
})(OutboxEventStatusEnum || (exports.OutboxEventStatusEnum = OutboxEventStatusEnum = {}));
let OutboxEventDto = OutboxEventDto_1 = class OutboxEventDto {
    static fromPgData(pgData) {
        if (Array.isArray(pgData)) {
            return pgData.map((event) => this.transformSingleEvent(event));
        }
        return this.transformSingleEvent(pgData);
    }
    static transformSingleEvent(pgData) {
        return (0, class_transformer_1.plainToInstance)(OutboxEventDto_1, {
            uuid: pgData.event_s_uuid,
            entity_uuid: pgData.entity_uuid,
            entity_type: pgData.entity_type,
            created_at: pgData.created_at,
            user_login: pgData.created_by,
            status: pgData.status,
            type: pgData.event_type,
            payload: pgData.payload_as_json,
            retry_count: pgData.retry_count,
        });
    }
};
exports.OutboxEventDto = OutboxEventDto;
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Отсутствует UUID События outbox',
    }),
    (0, class_validator_1.IsUUID)(4, {
        message: 'Идентификатор События outbox должен быть валидным UUID',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'UUID',
        description: 'Уникальный идентификатор События outbox (UUID_v4)',
        example: '15bdeb601-20ed-46b7-bc88-74e9478b717a',
        type: 'string',
        format: 'uuid',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "uuid", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Отсутствует UUID сущности',
    }),
    (0, class_validator_1.IsUUID)(4, {
        message: 'Идентификатор сущности должен быть валидным UUID',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Сущность UUID',
        description: 'Уникальный идентификатор сущности (UUID_v4)',
        example: '15bdeb601-20ed-46b7-bc88-74e9478b717a',
        type: 'string',
        format: 'uuid',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "entity_uuid", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Отсутствует тип сущности',
    }),
    (0, class_validator_1.IsString)({
        message: 'Тип сущности должен быть строкой',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Тип сущности',
        description: 'Тип сущности для которой создается событие',
        example: 'agreement',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "entity_type", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Отсутствует дата создания События',
    }),
    (0, class_validator_1.IsDateString)({ strict: true }, { message: 'Невалидная дата создания События' }),
    (0, swagger_1.ApiProperty)({
        title: 'Дата создания',
        description: 'Дата создания События',
        example: '2023-03-27T11:20:25.742Z',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "created_at", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Отсутствует создатель',
    }),
    (0, class_validator_1.IsString)({
        message: 'Создатель должен быть строкой',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Создатель',
        description: 'Пользователь, создавший документ',
        example: 'user123',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "user_login", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Остутствует Статус События',
    }),
    (0, class_validator_1.ValidateNested)({
        message: 'Невалидные данные Статуса События',
    }),
    (0, class_validator_1.IsEnum)(OutboxEventStatusEnum, {
        message: 'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Статус События',
        enum: OutboxEventStatusEnum,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Остутствует Тип События',
    }),
    (0, class_validator_1.IsString)({
        message: 'Тип События должен быть строкой',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Тип События',
        description: 'Тип события (например: CREATED, UPDATED, COMPLETED, CANCELED)',
        type: 'string',
        example: 'CREATED',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], OutboxEventDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsDefined)({
        message: 'Не указаны данные события',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Данные события',
        description: 'Объект с данными события',
        type: 'object',
        additionalProperties: true,
        nullable: true,
        deprecated: false,
    }),
    __metadata("design:type", Object)
], OutboxEventDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({
        message: 'Каунтер должен быть типа integer',
    }),
    (0, class_validator_1.Min)(0, {
        message: 'Каунтер не может быть отрицательным числом',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Каунтер',
        description: 'Количество повторных попыток отправить Событие в kafka, в случаи ошибки',
        type: 'integer',
        example: 1,
        nullable: true,
        required: false,
        deprecated: false,
    }),
    __metadata("design:type", Number)
], OutboxEventDto.prototype, "retry_count", void 0);
exports.OutboxEventDto = OutboxEventDto = OutboxEventDto_1 = __decorate([
    (0, swagger_1.ApiSchema)({
        name: 'OutboxEventDto',
        description: 'Инфо модель События outbox',
    })
], OutboxEventDto);
class OutboxEventLinkDto extends (0, swagger_1.PartialType)((0, swagger_1.PickType)(OutboxEventDto, ['uuid'])) {
}
exports.OutboxEventLinkDto = OutboxEventLinkDto;
//# sourceMappingURL=outbox-event.dto.js.map