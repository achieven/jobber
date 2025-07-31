import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { getConnectionOptions } from '../../shared/redis/redis.config'; 
import { getQueueOptions } from '../../shared/queue/queue';
import { QueueService } from './queue.service';


@Module({
    imports: [
        BullModule.forRoot({
            connection: getConnectionOptions()
        }),
        BullModule.registerQueue(getQueueOptions())
    ],
    providers: [QueueService],
    exports: [QueueService]
})
export class QueueModule {}
