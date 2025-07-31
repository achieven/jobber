import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [JobsModule, StatsModule]
})
export class WebServerModule {}
