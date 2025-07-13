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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxMigrationService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_2 = require("sequelize");
const constants_1 = require("../constants");
let OutboxMigrationService = class OutboxMigrationService {
    constructor(defaultSequelize, externalSequelize, config) {
        this.config = config;
        this.sequelize = externalSequelize || defaultSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided. Either configure database settings or provide external connection token.');
        }
        this.schema = this.config.database?.schema || 'public';
        this.tableName = this.config.database?.tableName || 'outbox_events';
    }
    async createOutboxTable() {
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
            type: sequelize_2.QueryTypes.RAW,
        });
    }
    async dropOutboxTable() {
        const dropTableSQL = `DROP TABLE IF EXISTS ${this.schema}.${this.tableName};`;
        await this.sequelize.query(dropTableSQL, {
            type: sequelize_2.QueryTypes.RAW,
        });
    }
    async createTableIfNotExists() {
        await this.createOutboxTable();
    }
    async addEntityTypeColumnIfNotExists() {
        const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = '${this.schema}' 
        AND table_name = '${this.tableName}' 
        AND column_name = 'entity_type';
    `;
        const result = await this.sequelize.query(checkColumnSQL, {
            type: sequelize_2.QueryTypes.SELECT,
        });
        if (result.length === 0) {
            const alterTableSQL = `
        ALTER TABLE ${this.schema}.${this.tableName} 
        ADD COLUMN entity_type VARCHAR(100) NOT NULL DEFAULT 'unknown';
        
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_entity_type 
        ON ${this.schema}.${this.tableName}(entity_type);
      `;
            await this.sequelize.query(alterTableSQL, {
                type: sequelize_2.QueryTypes.RAW,
            });
        }
    }
};
exports.OutboxMigrationService = OutboxMigrationService;
exports.OutboxMigrationService = OutboxMigrationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, sequelize_1.InjectConnection)()),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.EXTERNAL_SEQUELIZE_TOKEN)),
    __param(2, (0, common_1.Inject)(constants_1.OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize,
        sequelize_typescript_1.Sequelize, Object])
], OutboxMigrationService);
//# sourceMappingURL=outbox-migration.service.js.map