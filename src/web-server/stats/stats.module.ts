import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { CouchbaseModule } from '../../shared/couchbase/couchbase.module';
import { StatsService } from './stats.service';
import { VectorizationModule } from '../../shared/vectorization/vectorization.module';

@Module({
    imports: [CouchbaseModule, VectorizationModule],
    controllers: [StatsController],
    providers: [StatsService]
})
export class StatsModule {}
