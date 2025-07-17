import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({
  name: 'ChunkProcessingDto',
  description: 'Результат чанковой обработки событий outbox',
})
export class ChunkProcessingDto {
  @ApiProperty({
    title: 'Общее количество обработанных событий',
    description: 'Суммарное количество событий, которые были обработаны',
    type: 'integer',
    example: 250,
    nullable: false,
  })
  totalProcessed: number;

  @ApiProperty({
    title: 'Количество успешных чанков',
    description: 'Количество чанков, которые были успешно обработаны',
    type: 'integer',
    example: 2,
    nullable: false,
  })
  successChunks: number;

  @ApiProperty({
    title: 'Количество неудачных чанков',
    description: 'Количество чанков, при обработке которых произошли ошибки',
    type: 'integer',
    example: 1,
    nullable: false,
  })
  failedChunks: number;
}
