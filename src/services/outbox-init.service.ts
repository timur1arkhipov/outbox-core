import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OutboxMigrationService } from './outbox-migration.service';

@Injectable()
export class OutboxInitService implements OnModuleInit {
  private readonly logger = new Logger(OutboxInitService.name);

  constructor(
    private readonly outboxMigration: OutboxMigrationService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('🔄 Инициализация Outbox таблицы...');
      
      // Создание таблицы если не существует
      await this.outboxMigration.createTableIfNotExists();
      
      // Добавление колонки entity_type если обновляетесь с старой версии
      await this.outboxMigration.addEntityTypeColumnIfNotExists();
      
      this.logger.log('✅ Outbox таблица успешно инициализирована');
    } catch (error) {
      this.logger.error('❌ Ошибка инициализации Outbox таблицы:', error);
      // Не бросаем ошибку, чтобы не остановить запуск приложения
      // В production среде таблица может уже существовать
    }
  }
} 