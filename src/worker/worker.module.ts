import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { WorkerService } from './worker.service';

@Module({
    imports: [JobsModule],
    providers: [WorkerService],
    exports: [WorkerService],
})
export class WorkerModule {} 