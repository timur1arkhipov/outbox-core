import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';

@Injectable()
export class OutboxMigrationService {
  private readonly sequelize: Sequelize;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(
    @Optional() @InjectConnection() defaultSequelize: Sequelize,
    @Optional() @Inject(EXTERNAL_SEQUELIZE_TOKEN) externalSequelize: Sequelize,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
  ) {
    this.sequelize = externalSequelize || defaultSequelize;

    if (!this.sequelize) {
      throw new Error(
        'No Sequelize connection provided. Either configure database settings or provide external connection token.',
      );
    }

    this.schema = this.config.database?.schema || 'public';
    this.tableName = this.config.database?.tableName || 'outbox_events';
    
    console.log('OutboxMigrationService config:', {
      schema: this.schema,
      tableName: this.tableName,
      fullConfig: this.config.database
    });
  }

  async createOutboxTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.schema}.${this.tableName} (
        event_s_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_uuid UUID NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        event_date TIMESTAMP NOT NULL DEFAULT NOW(),
        user_d_login VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'READY_TO_SEND',
        event_type VARCHAR(100) NOT NULL,
        payload_as_json JSONB,
        retry_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status ON ${this.schema}.${this.tableName}(status);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_event_date ON ${this.schema}.${this.tableName}(event_date);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_entity_uuid ON ${this.schema}.${this.tableName}(entity_uuid);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_entity_type ON ${this.schema}.${this.tableName}(entity_type);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status_event_date ON ${this.schema}.${this.tableName}(status, event_date);
    `;

    await this.sequelize.query(createTableSQL, {
      type: QueryTypes.RAW,
    });
  }

  async dropOutboxTable(): Promise<void> {
    const dropTableSQL = `DROP TABLE IF EXISTS ${this.schema}.${this.tableName};`;

    await this.sequelize.query(dropTableSQL, {
      type: QueryTypes.RAW,
    });
  }

  async createTableIfNotExists(): Promise<void> {
    await this.createOutboxTable();
  }

  async addEntityTypeColumnIfNotExists(): Promise<void> {
    const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = '${this.schema}' 
        AND table_name = '${this.tableName}' 
        AND column_name = 'entity_type';
    `;

    const result = await this.sequelize.query(checkColumnSQL, {
      type: QueryTypes.SELECT,
    });

    if (result.length === 0) {
      const alterTableSQL = `
        ALTER TABLE ${this.schema}.${this.tableName} 
        ADD COLUMN entity_type VARCHAR(100) NOT NULL DEFAULT 'unknown';
        
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_entity_type 
        ON ${this.schema}.${this.tableName}(entity_type);
      `;

      await this.sequelize.query(alterTableSQL, {
        type: QueryTypes.RAW,
      });
    }
  }
}
