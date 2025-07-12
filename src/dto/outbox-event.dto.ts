import { ApiProperty, ApiSchema, PartialType, PickType } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export enum OutboxEventStatusEnum {
  READY_TO_SEND = 'READY_TO_SEND',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  ERROR = 'ERROR',
}

export type PgOutboxEvent = {
  event_s_uuid: string;
  entity_uuid: string;
  entity_type: string;
  created_at: string;
  created_by: string;
  status: string;
  event_type: string;
  payload_as_json: Record<string, any>;
  retry_count?: number | null;
};

@ApiSchema({
  name: 'OutboxEventDto',
  description: 'Инфо модель События outbox',
})
export class OutboxEventDto {
  @IsDefined({
    message: 'Отсутствует UUID События outbox',
  })
  @IsUUID(4, {
    message: 'Идентификатор События outbox должен быть валидным UUID',
  })
  @ApiProperty({
    title: 'UUID',
    description: 'Уникальный идентификатор События outbox (UUID_v4)',
    example: '15bdeb601-20ed-46b7-bc88-74e9478b717a',
    type: 'string',
    format: 'uuid',
    nullable: false,
    deprecated: false,
  })
  uuid!: string;

  @IsDefined({
    message: 'Отсутствует UUID сущности',
  })
  @IsUUID(4, {
    message: 'Идентификатор сущности должен быть валидным UUID',
  })
  @ApiProperty({
    title: 'Сущность UUID',
    description: 'Уникальный идентификатор сущности (UUID_v4)',
    example: '15bdeb601-20ed-46b7-bc88-74e9478b717a',
    type: 'string',
    format: 'uuid',
    nullable: false,
    deprecated: false,
  })
  entity_uuid!: string;

  @IsDefined({
    message: 'Отсутствует тип сущности',
  })
  @IsString({
    message: 'Тип сущности должен быть строкой',
  })
  @ApiProperty({
    title: 'Тип сущности',
    description: 'Тип сущности для которой создается событие',
    example: 'agreement',
    nullable: false,
    deprecated: false,
  })
  entity_type!: string;

  @IsDefined({
    message: 'Отсутствует дата создания События',
  })
  @IsDateString(
    { strict: true },
    { message: 'Невалидная дата создания События' },
  )
  @ApiProperty({
    title: 'Дата создания',
    description: 'Дата создания События',
    example: '2023-03-27T11:20:25.742Z',
    nullable: false,
    deprecated: false,
  })
  created_at!: string;

  @IsDefined({
    message: 'Отсутствует создатель',
  })
  @IsString({
    message: 'Создатель должен быть строкой',
  })
  @ApiProperty({
    title: 'Создатель',
    description: 'Пользователь, создавший документ',
    example: 'user123',
    nullable: false,
    deprecated: false,
  })
  user_login!: string;

  @IsDefined({
    message: 'Остутствует Статус События',
  })
  @ValidateNested({
    message: 'Невалидные данные Статуса События',
  })
  @IsEnum(OutboxEventStatusEnum, {
    message:
      'Статуса События должен быть одним из значений: READY_TO_SEND, PROCESSING, SENT, ERROR',
  })
  @ApiProperty({
    title: 'Статус События',
    enum: OutboxEventStatusEnum,
    nullable: false,
    deprecated: false,
  })
  status!: OutboxEventStatusEnum;

  @IsDefined({
    message: 'Остутствует Тип События',
  })
  @IsString({
    message: 'Тип События должен быть строкой',
  })
  @ApiProperty({
    title: 'Тип События',
    description:
      'Тип события (например: CREATED, UPDATED, COMPLETED, CANCELED)',
    type: 'string',
    example: 'CREATED',
    nullable: false,
    deprecated: false,
  })
  type!: string;

  @IsDefined({
    message: 'Не указаны данные события',
  })
  @ApiProperty({
    title: 'Данные события',
    description: 'Объект с данными события',
    type: 'object',
    additionalProperties: true,
    nullable: true,
    deprecated: false,
  })
  payload!: Record<string, any>;

  @IsOptional()
  @IsInt({
    message: 'Каунтер должен быть типа integer',
  })
  @Min(0, {
    message: 'Каунтер не может быть отрицательным числом',
  })
  @ApiProperty({
    title: 'Каунтер',
    description:
      'Количество повторных попыток отправить Событие в kafka, в случаи ошибки',
    type: 'integer',
    example: 1,
    nullable: true,
    required: false,
    deprecated: false,
  })
  retry_count?: number;

  static fromPgData(pgData: PgOutboxEvent): OutboxEventDto;
  static fromPgData(pgData: PgOutboxEvent[]): OutboxEventDto[];
  static fromPgData(
    pgData: PgOutboxEvent | PgOutboxEvent[],
  ): OutboxEventDto | OutboxEventDto[] {
    if (Array.isArray(pgData)) {
      return pgData.map((event) => this.transformSingleEvent(event));
    }
    return this.transformSingleEvent(pgData);
  }

  private static transformSingleEvent(pgData: PgOutboxEvent): OutboxEventDto {
    return plainToInstance(OutboxEventDto, {
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
}

export class OutboxEventLinkDto extends PartialType(
  PickType(OutboxEventDto, ['uuid'] as const),
) {}
