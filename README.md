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
        clientId: 'your-app-outbox'
      },
      defaultProcessing: {
        chunkSize: 100,
        maxRetries: 3,
        retryDelayMs: 1000,
        processingTimeoutMinutes: 5
      },
      topics: {
        'agreements': {
          topicName: 'agreements-events',
          entityTypes: ['agreement', 'contract'],
          processing: {
            chunkSize: 50,
            maxRetries: 5,
            retryDelayMs: 2000,
            processingTimeoutMinutes: 10
          }
        },
        'users': {
          topicName: 'users-events',
          entityTypes: ['user', 'profile']
        },
        'orders': {
          topicName: 'orders-events',
          entityTypes: ['order', 'payment', 'delivery']
        }
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
          clientId: configService.get('KAFKA_CLIENT_ID'),
        },
        topics: {
          'agreements': {
            topicName: configService.get('AGREEMENTS_TOPIC', 'agreements-events'),
            entityTypes: ['agreement', 'contract']
          },
          'users': {
            topicName: configService.get('USERS_TOPIC', 'users-events'),
            entityTypes: ['user', 'profile']
          }
        }
      })
    })
  ]
})
export class AppModule {}
```

### Быстрый старт (минимальная конфигурация)

Для начала работы можно использовать дефолтный топик:

```typescript
OutboxModule.forRoot({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'postgres',
    password: 'password'
  },
  kafka: {
    brokers: ['localhost:9092'],
    clientId: 'myapp-outbox'
  },
  defaultProcessing: {
    chunkSize: 100,
    maxRetries: 3,
    retryDelayMs: 1000,
    processingTimeoutMinutes: 5
  }
  // topics не указываем - будет использован дефолтный топик 'outbox-events'
})
```

## Использование в контроллерах

### Добавление декоратора @OutboxEvent

```typescript
import { Controller, Post, Put, Body, Param } from '@nestjs/common';
import { OutboxEvent } from '@rolfcorp/nestjs-outbox';

@Controller('agreements')
export class AgreementsController {

  @Post()
  @OutboxEvent('agreements', 'CREATED')
  async createAgreement(@Body() dto: CreateAgreementDto) {
    const agreement = await this.agreementService.create(dto);
    
    return {
      data: agreement, // ВАЖНО: объект должен содержать поле uuid
      _error: null
    };
  }

  @Put(':id')
  @OutboxEvent('agreements', 'UPDATED')
  async updateAgreement(@Param('id') id: string, @Body() dto: UpdateAgreementDto) {
    const updatedAgreement = await this.agreementService.update(id, dto);
    
    return {
      data: updatedAgreement,
      _error: null
    };
  }

  @Post(':id/complete')
  @OutboxEvent('agreements', 'COMPLETED')
  async completeAgreement(@Param('id') id: string) {
    const completedAgreement = await this.agreementService.complete(id);
    
    return {
      data: completedAgreement,
      _error: null
    };
  }
}
```

## Конфигурация топиков

Библиотека поддерживает множественные топики Kafka. Каждый топик настраивается отдельно:

### Структура конфигурации топиков

```typescript
topics: {
  'agreements': {
    topicName: 'agreements-events',           // Имя топика в Kafka
    entityTypes: ['agreement', 'contract'],   // Разрешенные entity_type
    processing: {                             // Переопределение настроек для топика
      chunkSize: 50,
      maxRetries: 5,
      retryDelayMs: 2000,
      processingTimeoutMinutes: 10
    }
  },
  'users': {
    topicName: 'users-events',
    entityTypes: ['user', 'profile']
    // processing не указан - используется defaultProcessing
  },
  'orders': {
    topicName: 'orders-events', 
    entityTypes: ['order', 'payment', 'delivery'],
    processing: {
      chunkSize: 200,
      maxRetries: 2
    }
  }
}
```

### Использование декоратора

```typescript
@OutboxEvent('agreements', 'CREATED')
async createAgreement() { ... }

@OutboxEvent('users', 'UPDATED') 
async updateUser() { ... }

@OutboxEvent('orders', 'COMPLETED')
async completeOrder() { ... }

// Дефолтный топик
@OutboxEvent('default', 'CREATED')
async createSomething() { ... }
```

### Определение entity_type

Entity_type определяется автоматически:
1. Из поля `entity_type` или `entityType` в объекте данных
2. Если не найден - используется первый из `entityTypes` конфигурации топика
3. Валидируется против разрешенных `entityTypes` для топика

### Ключи Kafka

Библиотека автоматически использует `entity_uuid` как ключ для всех событий. Это обеспечивает:

- **Правильное партиционирование** - все события одной сущности идут в одну партицию
- **Сохранение порядка** - события обрабатываются в том же порядке, в котором создавались
- **Консистентность** - гарантия доставки связанных событий

**Пример правильного порядка:**
```
agreement-123: CREATED → partition 0
agreement-123: UPDATED → partition 0    // Тот же ключ = та же партиция
agreement-123: COMPLETED → partition 0  // Порядок сохранён!
```

### Валидация

Библиотека проверяет:
- Существование конфигурации топика
- Соответствие entity_type разрешенным для топика

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

## Автоматическая инициализация

Библиотека автоматически создает таблицу `outbox_events` при запуске приложения. Никаких дополнительных действий не требуется.

## Ручная инициализация (опционально)

Если вы хотите контролировать процесс создания таблицы вручную:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxMigrationService } from '@rolfcorp/nestjs-outbox';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    private readonly outboxMigration: OutboxMigrationService,
  ) {}

  async onModuleInit() {
    // Создать таблицу outbox_events
    await this.outboxMigration.createOutboxTable();
    
    // Или удалить таблицу (осторожно!)
    // await this.outboxMigration.dropOutboxTable();
  }
}
```

## API методы

### OutboxService

```typescript
import { OutboxService } from '@rolfcorp/nestjs-outbox';

@Injectable()
export class SomeService {
  constructor(private readonly outboxService: OutboxService) {}

  // Отправить события в Kafka (обработка всех готовых событий)
  async processOutboxEvents() {
    const result = await this.outboxService.sendOutboxEventsInChunks();
    console.log(`Processed: ${result.data.totalProcessed} events`);
  }

  // Очистить зависшие события
  async cleanupStuckEvents() {
    const result = await this.outboxService.cleanupStuckEvents();
    console.log(`Cleaned up: ${result.data.processedCount} events`);
  }
}
```
