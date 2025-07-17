import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import { sql_createOutboxTable, sql_dropOutboxTable } from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';

@Injectable()
export class OutboxMigrationService {
  sql: Record<string, string>;
  private readonly sequelize: Sequelize;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(
    @Optional() @InjectConnection() internalSequelize: Sequelize,
    @Optional() @Inject(EXTERNAL_SEQUELIZE_TOKEN) externalSequelize: Sequelize,
    @Inject(OUTBOX_CONFIG) private readonly config: OutboxConfig,
  ) {
    this.sequelize = externalSequelize || internalSequelize;

    if (!this.sequelize) {
      throw new Error('No Sequelize connection provided.');
    }

    this.schema = this.config.database.schema; // возможно это можно улучшить
    this.tableName = this.config.database.tableName;

    this.sql = {
      createOutboxTable: replaceTablePlaceholders(
        sql_createOutboxTable,
        this.schema,
        this.tableName,
      ),
      dropOutboxTable: replaceTablePlaceholders(
        sql_dropOutboxTable,
        this.schema,
        this.tableName,
      ),
    };
  }



  async createOutboxTable(): Promise<void> {
    await this.sequelize.query(this.sql.createOutboxTable, {
      type: QueryTypes.RAW,
    });
  }

  async dropOutboxTable(): Promise<void> {
    await this.sequelize.query(this.sql.dropOutboxTable, {
      type: QueryTypes.RAW,
    });
  }
};
