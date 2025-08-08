import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule as SharedQueueModule } from '../../shared/queue/queue.module';
import { getConnectionOptions } from '../../shared/redis/redis.config';
import { QueueConfigService } from '../../shared/queue/queue.service';
import { QueueService } from './queue.service';
import { ConnectionOptions } from 'bullmq';

@Module({
    imports: [
        BullModule.registerQueue({
            name: QueueConfigService.QUEUE_NAME,
            connection: getConnectionOptions() as ConnectionOptions,
            defaultJobOptions: new QueueConfigService().getQueueOptions().defaultJobOptions,
        }),
        SharedQueueModule,
    ],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
