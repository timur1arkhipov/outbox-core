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
import { Injectable, Logger } from '@nestjs/common';
import { OutboxMigrationService } from './outbox-migration.service';
let OutboxInitService = OutboxInitService_1 = class OutboxInitService {
    constructor(outboxMigration) {
        this.outboxMigration = outboxMigration;
        this.logger = new Logger(OutboxInitService_1.name);
    }
    async onModuleInit() {
        try {
            this.logger.log('Initializing Outbox table...');
            await this.outboxMigration.createOutboxTable();
            this.logger.log('Outbox table successfully initialized');
        }
        catch (error) {
            this.logger.error('Error initializing Outbox table:', error);
        }
    }
};
OutboxInitService = OutboxInitService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OutboxMigrationService])
], OutboxInitService);
export { OutboxInitService };
//# sourceMappingURL=outbox-init.service.js.map