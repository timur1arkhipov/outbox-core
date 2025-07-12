# @rolfcorp/nestjs-outbox

Библиотека для реализации паттерна Outbox в NestJS приложениях с автоматической отправкой событий в Kafka.

## Установка

```bash
npm install @rolfcorp/nestjs-outbox
```

## Подключение модуля

### 1. Синхронная конфигурация

```typescript
import { Module } from '@nestjs/common';
import { OutboxModule } from '@rolfcorp/nestjs-outbox';

@Module({
  imports: [
    OutboxModule.forRoot({
      database: {
        host: 'localhost',
        port: 5432,
        database: 'your_db',
        username: 'postgres',
        password: 'password',
        schema: 'public',
        tableName: 'outbox_events'
      },
      kafka: {
        brokers: ['localhost:9092'],
        topic: 'outbox-events',
        clientId: 'your-app-outbox'
      },
      processing: {
        chunkSize: 100,
        maxRetries: 3,
        retryDelayMs: 1000,
        processingTimeoutMinutes: 5
      }
    })
  ]
})
export class AppModule {}
```

### 2. Асинхронная конфигурация

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboxModule } from '@rolfcorp/nestjs-outbox';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OutboxModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        database: {
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          database: configService.get('DB_NAME'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
        },
        kafka: {
          brokers: configService.get('KAFKA_BROKERS').split(','),
          topic: configService.get('KAFKA_TOPIC'),
          clientId: configService.get('KAFKA_CLIENT_ID'),
        }
      })
    })
  ]
})
export class AppModule {}
```

## Использование в контроллерах

### Добавление декоратора @OutboxEvent

```typescript
import { Controller, Post, Put, Body, Param } from '@nestjs/common';
import { OutboxEvent } from '@rolfcorp/nestjs-outbox';

@Controller('agreements')
export class AgreementsController {

  @Post()
  @OutboxEvent('CREATED', 'agreement')
  async createAgreement(@Body() dto: CreateAgreementDto) {
    const agreement = await this.agreementService.create(dto);
    
    return {
      data: agreement, // ВАЖНО: объект должен содержать поле uuid
      _error: null
    };
  }

  @Put(':id')
  @OutboxEvent('UPDATED', 'agreement')
  async updateAgreement(@Param('id') id: string, @Body() dto: UpdateAgreementDto) {
    const updatedAgreement = await this.agreementService.update(id, dto);
    
    return {
      data: updatedAgreement,
      _error: null
    };
  }

  @Post(':id/complete')
  @OutboxEvent('COMPLETED', 'agreement')
  async completeAgreement(@Param('id') id: string) {
    const completedAgreement = await this.agreementService.complete(id);
    
    return {
      data: completedAgreement,
      _error: null
    };
  }
}
```

## Требования к ответу

⚠️ **ВАЖНО:** Методы с декоратором `@OutboxEvent` ДОЛЖНЫ возвращать объект в формате:

```typescript
{
  data: {
    uuid: 'обязательное-поле-uuid', // БЕЗ uuid события НЕ создаются!
    // ... другие поля
  },
  _error: null
}
```

## Создание таблицы

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxMigrationService } from '@rolfcorp/nestjs-outbox';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly outboxMigration: OutboxMigrationService
  ) {}

  async onModuleInit() {
    await this.outboxMigration.createTableIfNotExists();
  }
}
```

## Миграция существующих таблиц

Если вы обновляетесь с более ранней версии библиотеки, добавьте отсутствующую колонку `entity_type`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxMigrationService } from '@rolfcorp/nestjs-outbox';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly outboxMigration: OutboxMigrationService
  ) {}

  async onModuleInit() {
    // Для новых установок
    await this.outboxMigration.createTableIfNotExists();
    
    // Для обновления существующих таблиц (добавляет entity_type колонку)
    await this.outboxMigration.addEntityTypeColumnIfNotExists();
  }
}
```

## Обработка событий

```typescript
import { Injectable } from '@nestjs/common';
import { OutboxService } from '@rolfcorp/nestjs-outbox';

@Injectable()
export class OutboxProcessor {
  constructor(private readonly outboxService: OutboxService) {}

  async processEvents() {
    const result = await this.outboxService.sendOutboxEventsInChunks(50);
    if (result._error) {
      console.error('Ошибка обработки:', result._error);
    } else {
      console.log(`Обработано: ${result.data.totalProcessed} событий`);
    }
  }
}
```

## Настройка телеметрии (опционально)

```bash
npm install @opentelemetry/api
```

```typescript
OutboxModule.forRoot({
  // ... другие настройки
  telemetry: {
    enabled: true,
    serviceName: 'your-service',
    serviceVersion: '1.0.0'
  }
})
```

## Лицензия

MIT 