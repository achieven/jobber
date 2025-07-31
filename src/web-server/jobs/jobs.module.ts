import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [JobsController]
})
export class JobsModule {}
