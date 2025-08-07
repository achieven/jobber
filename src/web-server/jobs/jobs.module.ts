import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { QueueModule } from '../queue/queue.module';
import { CouchbaseModule } from '../../shared/couchbase/couchbase.module';

@Module({
    imports: [QueueModule, CouchbaseModule],
    controllers: [JobsController]
})
export class JobsModule {}
