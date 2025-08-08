import { Module } from '@nestjs/common';
import { QueueConfigService } from './queue.service';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [QueueConfigService],
    exports: [QueueConfigService]
})
export class QueueModule {}
