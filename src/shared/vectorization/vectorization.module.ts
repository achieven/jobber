import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { TextToVectorService } from './text-to-vector.service';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [OpenAIService, TextToVectorService],
    exports: [OpenAIService, TextToVectorService]
})
export class VectorizationModule {}
