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
import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { OUTBOX_CONFIG, EXTERNAL_SEQUELIZE_TOKEN } from '../constants';
import { sql_createOutboxTable, sql_dropOutboxTable } from '../sql';
import { replaceTablePlaceholders } from '../utils/sql.utils';
let OutboxMigrationService = class OutboxMigrationService {
    constructor(internalSequelize, externalSequelize, config) {
        this.config = config;
        this.sequelize = externalSequelize || internalSequelize;
        if (!this.sequelize) {
            throw new Error('No Sequelize connection provided.');
        }
        this.schema = this.config.database.schema;
        this.tableName = this.config.database.tableName;
        this.sql = {
            createOutboxTable: replaceTablePlaceholders(sql_createOutboxTable, this.schema, this.tableName),
            dropOutboxTable: replaceTablePlaceholders(sql_dropOutboxTable, this.schema, this.tableName),
        };
    }
    async createOutboxTable() {
        await this.sequelize.query(this.sql.createOutboxTable, {
            type: QueryTypes.RAW,
        });
    }
    async dropOutboxTable() {
        await this.sequelize.query(this.sql.dropOutboxTable, {
            type: QueryTypes.RAW,
        });
    }
};
OutboxMigrationService = __decorate([
    Injectable(),
    __param(0, Optional()),
    __param(0, InjectConnection()),
    __param(1, Optional()),
    __param(1, Inject(EXTERNAL_SEQUELIZE_TOKEN)),
    __param(2, Inject(OUTBOX_CONFIG)),
    __metadata("design:paramtypes", [Sequelize,
        Sequelize, Object])
], OutboxMigrationService);
export { OutboxMigrationService };
;
//# sourceMappingURL=outbox-migration.service.js.map