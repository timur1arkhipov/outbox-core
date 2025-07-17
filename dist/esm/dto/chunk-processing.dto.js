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
let ChunkProcessingDto = class ChunkProcessingDto {
};
__decorate([
    ApiProperty({
        title: 'Общее количество обработанных событий',
        description: 'Суммарное количество событий, которые были обработаны',
        type: 'integer',
        example: 250,
        nullable: false,
    }),
    __metadata("design:type", Number)
], ChunkProcessingDto.prototype, "totalProcessed", void 0);
__decorate([
    ApiProperty({
        title: 'Количество успешных чанков',
        description: 'Количество чанков, которые были успешно обработаны',
        type: 'integer',
        example: 2,
        nullable: false,
    }),
    __metadata("design:type", Number)
], ChunkProcessingDto.prototype, "successChunks", void 0);
__decorate([
    ApiProperty({
        title: 'Количество неудачных чанков',
        description: 'Количество чанков, при обработке которых произошли ошибки',
        type: 'integer',
        example: 1,
        nullable: false,
    }),
    __metadata("design:type", Number)
], ChunkProcessingDto.prototype, "failedChunks", void 0);
ChunkProcessingDto = __decorate([
    ApiSchema({
        name: 'ChunkProcessingDto',
        description: 'Результат чанковой обработки событий outbox',
    })
], ChunkProcessingDto);
export { ChunkProcessingDto };
//# sourceMappingURL=chunk-processing.dto.js.map