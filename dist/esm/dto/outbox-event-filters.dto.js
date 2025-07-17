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
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested, IsDefined, IsEnum, IsBoolean, IsString, } from 'class-validator';
import { OutboxEventStatusEnum } from './outbox-event.dto';
export class EntityLinkDto {
}
__decorate([
    IsUUID(4, {
        message: 'Идентификатор сущности должен быть валидным UUID',
    }),
    ApiProperty({
        title: 'UUID сущности',
        description: 'Уникальный идентификатор сущности (UUID_v4)',
        type: 'string',
        format: 'uuid',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", String)
], EntityLinkDto.prototype, "uuid", void 0);
let OutboxEventFiltersDto = class OutboxEventFiltersDto {
};
__decorate([
    IsOptional(),
    IsArray({
        message: 'Фильтры для поиска Событии outbox должны передаваться массивом',
    }),
    IsUUID(4, {
        each: true,
        message: 'Передан невалидный UUID для поиска Событии outbox',
    }),
    ApiProperty({
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
    IsOptional(),
    IsArray({
        message: 'Фильтр по сущностям должен передаваться массивом',
    }),
    ValidateNested({
        each: true,
        message: 'Невалидный фильтр по сущностям outbox',
    }),
    Type(() => EntityLinkDto),
    ApiProperty({
        title: 'UUID сущностей',
        description: 'Идентификаторы сущностей (UUID_v4)',
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "entities", void 0);
__decorate([
    IsOptional(),
    IsArray({
        message: 'Фильтр по типам сущностей должен передаваться массивом',
    }),
    IsString({
        each: true,
        message: 'Тип сущности должен быть строкой',
    }),
    ApiProperty({
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
    IsOptional(),
    IsArray({
        message: 'Фильтр по Событиям должен передаваться массивом',
    }),
    ValidateNested({
        each: true,
        message: 'Невалидный фильтр по Событиям outbox',
    }),
    IsEnum(OutboxEventStatusEnum, {
        each: true,
        message: 'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
    }),
    ApiProperty({
        title: 'Статус События',
        enum: OutboxEventStatusEnum,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Array)
], OutboxEventFiltersDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsBoolean({
        message: 'with_lock должен быть булевым значением',
    }),
    ApiProperty({
        title: 'Использовать блокировку',
        description: 'Флаг для использования FOR UPDATE SKIP LOCKED в запросе',
        type: 'boolean',
        nullable: true,
        deprecated: false,
        required: false,
    }),
    __metadata("design:type", Boolean)
], OutboxEventFiltersDto.prototype, "with_lock", void 0);
__decorate([
    IsOptional(),
    ApiProperty({
        title: 'Лимит выборки',
        description: 'Максимальное количество событий для выборки (чанк)',
        type: 'integer',
        nullable: true,
        required: false,
        example: 100,
    }),
    __metadata("design:type", Number)
], OutboxEventFiltersDto.prototype, "limit", void 0);
OutboxEventFiltersDto = __decorate([
    ApiSchema({
        name: 'OutboxEventFilters',
        description: 'Схема, описывающая фильтры, по которым можно получить События outbox',
    })
], OutboxEventFiltersDto);
export { OutboxEventFiltersDto };
export class OutboxEventFiltersBodyDto {
}
__decorate([
    IsDefined(),
    ValidateNested(),
    Type(() => OutboxEventFiltersDto),
    __metadata("design:type", OutboxEventFiltersDto)
], OutboxEventFiltersBodyDto.prototype, "data", void 0);
//# sourceMappingURL=outbox-event-filters.dto.js.map