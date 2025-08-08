import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { WorkerService } from './worker.service';
import { QueueModule } from '../shared/queue/queue.module';

@Module({
    imports: [JobsModule, QueueModule],
    providers: [WorkerService],
    exports: [WorkerService],
})
export class WorkerModule {} 