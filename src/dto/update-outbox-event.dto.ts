import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsDefined } from 'class-validator';
import { OutboxEventStatusEnum } from './outbox-event.dto';

@ApiSchema({
  name: 'UpdateOutboxEvent',
  description:
    'Схема, описывающая данные, которые необходимо передать для обновления События outbox',
})
export class UpdateOutboxEventDto {
  @IsDefined({
    message: 'Остутствует Статус События',
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
}
