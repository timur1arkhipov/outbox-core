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
import { IsInt, Min } from 'class-validator';
let CleanupResultDto = class CleanupResultDto {
};
__decorate([
    IsInt({
        message: 'updatedToReady должно быть целым числом',
    }),
    Min(0, {
        message: 'updatedToReady не может быть отрицательным',
    }),
    ApiProperty({
        title: 'Обновлено в READY_TO_SEND',
        description: 'Количество событий, возвращенных в статус READY_TO_SEND',
        type: 'integer',
        example: 5,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Number)
], CleanupResultDto.prototype, "updatedToReady", void 0);
__decorate([
    IsInt({
        message: 'updatedToError должно быть целым числом',
    }),
    Min(0, {
        message: 'updatedToError не может быть отрицательным',
    }),
    ApiProperty({
        title: 'Обновлено в ERROR',
        description: 'Количество событий, помеченных как ERROR из-за превышения лимита retry',
        type: 'integer',
        example: 2,
        nullable: false,
        deprecated: false,
    }),
    __metadata("design:type", Number)
], CleanupResultDto.prototype, "updatedToError", void 0);
CleanupResultDto = __decorate([
    ApiSchema({
        name: 'CleanupResultDto',
        description: 'Результат очистки зависших событий outbox',
    })
], CleanupResultDto);
export { CleanupResultDto };
//# sourceMappingURL=cleanup-result.dto.js.map