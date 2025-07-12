import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  IsDefined,
  IsEnum,
  IsBoolean,
  IsString,
} from 'class-validator';
import { OutboxEventStatusEnum } from './outbox-event.dto';

export class EntityLinkDto {
  @IsUUID(4, {
    message: 'Идентификатор сущности должен быть валидным UUID',
  })
  uuid!: string;
}

@ApiSchema({
  name: 'OutboxEventFilters',
  description:
    'Схема, описывающая фильтры, по которым можно получить События outbox',
})
export class OutboxEventFiltersDto {
  @IsOptional()
  @IsArray({
    message: 'Фильтры для поиска Событии outbox должны передаваться массивом',
  })
  @IsUUID(4, {
    each: true,
    message: 'Передан невалидный UUID для поиска Событии outbox',
  })
  @ApiProperty({
    title: 'UUID Событии outbox',
    description: 'Массив идентификаторов Событии outbox (UUID_v4)',
    nullable: false,
    type: 'array',
    items: {
      type: 'string',
      format: 'uuid',
    },
    deprecated: false,
  })
  uuid?: string[];

  @IsOptional()
  @IsArray({
    message: 'Фильтр по сущностям должен передаваться массивом',
  })
  @ValidateNested({
    each: true,
    message: 'Невалидный фильтр по сущностям outbox',
  })
  @Type(() => EntityLinkDto)
  @ApiProperty({
    title: 'UUID сущностей',
    description: 'Идентификаторы сущностей (UUID_v4)',
    nullable: false,
    deprecated: false,
  })
  entities?: EntityLinkDto[];

  @IsOptional()
  @IsArray({
    message: 'Фильтр по типам сущностей должен передаваться массивом',
  })
  @IsString({
    each: true,
    message: 'Тип сущности должен быть строкой',
  })
  @ApiProperty({
    title: 'Типы сущностей',
    description: 'Фильтр по типам сущностей',
    type: [String],
    nullable: true,
    deprecated: false,
    required: false,
  })
  entity_types?: string[];

  @IsOptional()
  @IsArray({
    message: 'Фильтр по Событиям должен передаваться массивом',
  })
  @ValidateNested({
    each: true,
    message: 'Невалидный фильтр по Событиям outbox',
  })
  @IsEnum(OutboxEventStatusEnum, {
    each: true,
    message:
      'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
  })
  @ApiProperty({
    title: 'Статус События',
    enum: OutboxEventStatusEnum,
    nullable: false,
    deprecated: false,
  })
  status?: OutboxEventStatusEnum[];

  @IsOptional()
  @IsBoolean({
    message: 'with_lock должен быть булевым значением',
  })
  @ApiProperty({
    title: 'Использовать блокировку',
    description: 'Флаг для использования FOR UPDATE SKIP LOCKED в запросе',
    type: 'boolean',
    nullable: true,
    deprecated: false,
    required: false,
  })
  with_lock?: boolean;
}

export class OutboxEventFiltersBodyDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => OutboxEventFiltersDto)
  data!: OutboxEventFiltersDto;
}
