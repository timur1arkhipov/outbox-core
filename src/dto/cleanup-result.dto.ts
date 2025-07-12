import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

@ApiSchema({
  name: 'CleanupResultDto',
  description: 'Результат очистки зависших событий outbox',
})
export class CleanupResultDto {
  @IsInt({
    message: 'updatedToReady должно быть целым числом',
  })
  @Min(0, {
    message: 'updatedToReady не может быть отрицательным',
  })
  @ApiProperty({
    title: 'Обновлено в READY_TO_SEND',
    description: 'Количество событий, возвращенных в статус READY_TO_SEND',
    type: 'integer',
    example: 5,
    nullable: false,
    deprecated: false,
  })
  updatedToReady!: number;

  @IsInt({
    message: 'updatedToError должно быть целым числом',
  })
  @Min(0, {
    message: 'updatedToError не может быть отрицательным',
  })
  @ApiProperty({
    title: 'Обновлено в ERROR',
    description:
      'Количество событий, помеченных как ERROR из-за превышения лимита retry',
    type: 'integer',
    example: 2,
    nullable: false,
    deprecated: false,
  })
  updatedToError!: number;
}
