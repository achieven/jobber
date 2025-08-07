import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CouchbaseModule } from '../../shared/couchbase/couchbase.module';
import { OpenAIService } from '../../shared/vectorization/openai.service';

@Module({
    imports: [CouchbaseModule],
    providers: [JobsService, OpenAIService],
    exports: [JobsService]
})
export class JobsModule {} 