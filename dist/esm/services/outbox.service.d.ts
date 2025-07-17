import { Transaction } from 'sequelize';
import { OutboxDbService } from './outbox.db.service';
import { OutboxEventFiltersDto } from '../dto/outbox-event-filters.dto';
import { OutboxEventDto } from '../dto/outbox-event.dto';
import { UpdateOutboxEventDto } from '../dto/update-outbox-event.dto';
import { OutboxProducerService } from './outbox-producer.service';
import { OutboxEventMsgDto } from '../dto/outbox-event-msg.dto';
import { ChunkProcessingDto } from '../dto/chunk-processing.dto';
import { CleanupResultDto } from '../dto/cleanup-result.dto';
import { PromiseWithError } from '../types/result.type';
import type { OutboxConfig } from '../interfaces/outbox-config.interface';
export declare class OutboxService {
    private readonly dbService;
    private readonly kafkaProducer;
    private readonly config;
    constructor(dbService: OutboxDbService, kafkaProducer: OutboxProducerService, config: OutboxConfig);
    private getTopicConfigByEntityType;
    private generateKafkaKey;
    private groupEventsByKey;
    receiveOutboxEventInfomodels(filters: OutboxEventFiltersDto, transaction?: Transaction): PromiseWithError<OutboxEventDto[]>;
    selectBeforeOutboxEventsInfomodels(entity_uuids: string[], transaction?: Transaction): PromiseWithError<OutboxEventDto[]>;
    updateOutboxEvents(uuid: string[], data: UpdateOutboxEventDto, transaction?: Transaction): PromiseWithError<void>;
    produceMessage(payload: OutboxEventMsgDto[], targetTopic?: string): PromiseWithError<void>;
    sendOutboxEventsInChunks(chunkSize?: number): PromiseWithError<ChunkProcessingDto>;
    private processEventChunkByTopics;
    private sendChunkWithRetry;
    private groupEventsByEntity;
    private createChunksFromGroupedEvents;
    private buildPayloadMsgForChunk;
    private sortEventsByDate;
    private cleanupStuckEventsInt;
    private lockAndMarkEventsAsProcessing;
    cleanupStuckEvents(): PromiseWithError<CleanupResultDto>;
}
//# sourceMappingURL=outbox.service.d.ts.map