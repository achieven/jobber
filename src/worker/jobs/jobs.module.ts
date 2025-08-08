import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CouchbaseModule } from '../../shared/couchbase/couchbase.module';
import { VectorizationModule } from '../../shared/vectorization/vectorization.module';

@Module({
    imports: [CouchbaseModule, VectorizationModule],
    providers: [JobsService],
    exports: [JobsService]
})
export class JobsModule {} 