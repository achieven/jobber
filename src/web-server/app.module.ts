import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [JobsModule, StatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
