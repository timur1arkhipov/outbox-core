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
exports.OutboxEventFiltersBodyDto = exports.OutboxEventFiltersDto = exports.EntityLinkDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const outbox_event_dto_1 = require("./outbox-event.dto");
class EntityLinkDto {
}
exports.EntityLinkDto = EntityLinkDto;
__decorate([
    (0, class_validator_1.IsUUID)(4, {
        message: 'Идентификатор сущности должен быть валидным UUID',
    }),
    __metadata("design:type", String)
], EntityLinkDto.prototype, "uuid", void 0);
let OutboxEventFiltersDto = class OutboxEventFiltersDto {
};
exports.OutboxEventFiltersDto = OutboxEventFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'Фильтры для поиска Событии outbox должны передаваться массивом',
    }),
    (0, class_validator_1.IsUUID)(4, {
        each: true,
        message: 'Передан невалидный UUID для поиска Событии outbox',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'UUID Событии outbox',
        description: 'Массив идентификаторов Событии outbox (UUID_v4)',
        nullable: false,
        type: 'array',
        items: {
            type: 'string',
            format: 'uuid',
        },
        deprecated: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "uuid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'Фильтр по сущностям должен передаваться массивом',
    }),
    (0, class_validator_1.ValidateNested)({
        each: true,
        message: 'Невалидный фильтр по сущностям outbox',
    }),
    (0, class_transformer_1.Type)(() => EntityLinkDto),
    (0, swagger_1.ApiProperty)({
        title: 'UUID сущностей',
        description: 'Идентификаторы сущностей (UUID_v4)',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "entities", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'Фильтр по типам сущностей должен передаваться массивом',
    }),
    (0, class_validator_1.IsString)({
        each: true,
        message: 'Тип сущности должен быть строкой',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Типы сущностей',
        description: 'Фильтр по типам сущностей',
        type: [String],
        nullable: true,
        deprecated: false,
        required: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "entity_types", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({
        message: 'Фильтр по Событиям должен передаваться массивом',
    }),
    (0, class_validator_1.ValidateNested)({
        each: true,
        message: 'Невалидный фильтр по Событиям outbox',
    }),
    (0, class_validator_1.IsEnum)(outbox_event_dto_1.OutboxEventStatusEnum, {
        each: true,
        message: 'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Статус События',
        enum: outbox_event_dto_1.OutboxEventStatusEnum,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'with_lock должен быть булевым значением',
    }),
    (0, swagger_1.ApiProperty)({
        title: 'Использовать блокировку',
        description: 'Флаг для использования FOR UPDATE SKIP LOCKED в запросе',
        type: 'boolean',
        nullable: true,
        deprecated: false,
        required: false,
    }),
    __metadata("design:type", Boolean)
], OutboxEventFiltersDto.prototype, "with_lock", void 0);
exports.OutboxEventFiltersDto = OutboxEventFiltersDto = __decorate([
    (0, swagger_1.ApiSchema)({
        name: 'OutboxEventFilters',
        description: 'Схема, описывающая фильтры, по которым можно получить События outbox',
    })
], OutboxEventFiltersDto);
class OutboxEventFiltersBodyDto {
}
exports.OutboxEventFiltersBodyDto = OutboxEventFiltersBodyDto;
__decorate([
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OutboxEventFiltersDto),
    __metadata("design:type", OutboxEventFiltersDto)
], OutboxEventFiltersBodyDto.prototype, "data", void 0);
//# sourceMappingURL=outbox-event-filters.dto.js.map