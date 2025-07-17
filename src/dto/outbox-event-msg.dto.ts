import { ApiProperty, ApiSchema, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { OutboxEventDto } from './outbox-event.dto';

interface AgreementDto {
  [key: string]: any;
}

@ApiSchema({
  name: 'OutboxEventMsgPayload',
  description: 'Инфо модель payload События outbox для отправки в kafka',
})
export class OutboxEventMsgPayload {
  @IsDefined({
    message: 'Не указан before события',
  })
  @ValidateNested({
    each: true,
    message: 'Невалидные данные before события',
  })
  @ApiProperty({
    title: 'Данные before События',
    nullable: true,
    deprecated: false,
  })
  before: AgreementDto | null;

  @IsDefined({
    message: 'Не указан after события',
  })
  @ValidateNested({
    each: true,
    message: 'Невалидные данные after события',
  })
  @ApiProperty({
    title: 'Данные after События',
    nullable: false,
    deprecated: false,
  })
  after: AgreementDto;
}

@ApiSchema({
  name: 'OutboxEventMsgDto',
  description: 'Инфо модель События outbox для отправки в kafka',
})
export class OutboxEventMsgDto extends OmitType(OutboxEventDto, [
  'payload',
] as const) {
  @IsDefined({
    message: 'Не указан payload События',
  })
  @ValidateNested({
    each: true,
    message: 'Невалидные данные События',
  })
  @Type(() => OutboxEventMsgPayload)
  @ApiProperty({
    title: 'Данные Событий',
    description: 'Событие для отправки в kafka',
    nullable: false,
    deprecated: false,
  })
  payload: OutboxEventMsgPayload;
}
