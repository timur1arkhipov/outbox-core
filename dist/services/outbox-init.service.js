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
var OutboxInitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxInitService = void 0;
const common_1 = require("@nestjs/common");
const outbox_migration_service_1 = require("./outbox-migration.service");
let OutboxInitService = OutboxInitService_1 = class OutboxInitService {
    constructor(outboxMigration) {
        this.outboxMigration = outboxMigration;
        this.logger = new common_1.Logger(OutboxInitService_1.name);
        console.log('🏗️ OutboxInitService constructor called at:', new Date().toISOString());
    }
    async onModuleInit() {
        console.log('🚀 OutboxInitService.onModuleInit() called at:', new Date().toISOString());
        try {
            this.logger.log('🔄 Инициализация Outbox таблицы...');
            // Логируем конфигурацию перед созданием таблицы
            this.logger.log('📋 Используемая конфигурация:', JSON.stringify({
                schema: this.outboxMigration['schema'],
                tableName: this.outboxMigration['tableName'],
                fullConfig: this.outboxMigration['config']?.database
            }, null, 2));
            // Создание таблицы если не существует
            await this.outboxMigration.createTableIfNotExists();
            // Добавление колонки entity_type если обновляетесь с старой версии
            await this.outboxMigration.addEntityTypeColumnIfNotExists();
            this.logger.log('✅ Outbox таблица успешно инициализирована');
        }
        catch (error) {
            this.logger.error('❌ Ошибка инициализации Outbox таблицы:', error);
            // Не бросаем ошибку, чтобы не остановить запуск приложения
            // В production среде таблица может уже существовать
        }
    }
};
exports.OutboxInitService = OutboxInitService;
exports.OutboxInitService = OutboxInitService = OutboxInitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbox_migration_service_1.OutboxMigrationService])
], OutboxInitService);
//# sourceMappingURL=outbox-init.service.js.map