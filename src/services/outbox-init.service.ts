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
      this.logger.log('Initializing Outbox table...');
      
      await this.outboxMigration.createOutboxTable();
      
      this.logger.log('Outbox table successfully initialized');
    } catch (error) {
      this.logger.error('Error initializing Outbox table:', error);
    }
  }
} 