import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QueueConfigService } from '../shared/queue/queue.service';
import { JobsService } from './jobs/jobs.service';
import { JOB_STATUS } from '../shared/models/job';
import { executeCppJob } from './jobs/cpp-job-executor';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
    private worker: Worker;

    constructor(
        private readonly jobsService: JobsService,
        private readonly queueConfigService: QueueConfigService,
    ) {}

    async onModuleInit() {
        this.initializeWorker();
    }

    private initializeWorker() {
        this.worker = new Worker(
            QueueConfigService.QUEUE_NAME,
            async (job: Job) => {
                try {
                    const result = await executeCppJob(job.name, job.data, job.attemptsMade + 1);
                    console.log('Job', job.id, 'completed successfully');
                    return { success: true, result: result };
                } catch (error) {
                    console.error('Job', job.id, 'failed on attempt', job.attemptsMade);
                    if (job.attemptsMade + 1 >= job.opts.attempts) {
                        console.error('Job', job.id, 'has exhausted all', job.opts.attempts, 'attempts. Marking as permanently failed.');
                    } else {
                        console.log('Job', job.id, 'will be retried. Attempts remaining:', job.opts.attempts - (job.attemptsMade + 1));
                    }
                    throw error;
                }
            },
            this.queueConfigService.getWorkerOptions(),
        );

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.worker.on('progress', async (job: Job, progress: number | object) => {
            // Handle progress updates
        });

        this.worker.on('active', async (job: Job) => {
            await this.jobsService.setActiveJob(job.id, job.name, job.data, JOB_STATUS.ACTIVE, {});
        });

        this.worker.on('completed', async (job: Job) => {
            await this.jobsService.setCompletedJob(job.id, job.name, job.data, JOB_STATUS.COMPLETED, {
                result: job.returnvalue
            });
        });

        this.worker.on('error', (err) => {
            // Worker error handling
        });

        this.worker.on('failed', async (job: Job, err: Error) => {
            await this.jobsService.setFailedJob(job.id, job.name, job.data, JOB_STATUS.FAILED, {
                error: err.message,
            });
        });
    }

    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
        }
    }
} 