import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OutboxMigrationService } from './outbox-migration.service';

@Injectable()
export class OutboxInitService implements OnModuleInit {
  private readonly logger = new Logger(OutboxInitService.name);

  constructor(
    private readonly outboxMigration: OutboxMigrationService,
  ) {
  }

  async onModuleInit() {
    try {
      this.logger.log('🔄 Инициализация Outbox таблицы...');
      
      await this.outboxMigration.createTableIfNotExists();
      
      await this.outboxMigration.addEntityTypeColumnIfNotExists();
      
      this.logger.log('Outbox таблица успешно инициализирована');
    } catch (error) {
      this.logger.error('Ошибка инициализации Outbox таблицы:', error);
    }
  }
} 