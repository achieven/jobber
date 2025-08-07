import { Injectable, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { getQueueOptions, getWorkerOptions } from '../shared/queue/queue';
import { getConnectionOptions } from '../shared/redis/redis.config';
import { JobsService } from './jobs/jobs.service';
import { JOB_STATUS } from '../shared/models/job';
import { executeCppJob } from './jobs/cpp-job-executor';

@Injectable()
export class WorkerService implements OnModuleInit {
    private worker: Worker;

    constructor(private readonly jobsService: JobsService) {}

    async onModuleInit() {
        this.initializeWorker();
    }

    private initializeWorker() {
        this.worker = new Worker(
            getQueueOptions().name,
            async (job: Job) => {
                console.log(`[${new Date().toISOString()}] Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts}) with data: ${JSON.stringify(job.data)}`);

                try {
                    const result = await executeCppJob(job.name, job.data, job.attemptsMade + 1);
                    console.log(`[${new Date().toISOString()}] Job ${job.id} completed successfully. Result: ${result}`);
                    return { success: true, result: result };
                } catch (error) {
                    console.error(`[${new Date().toISOString()}] Job ${job.id} failed on attempt ${job.attemptsMade + 1}. Error: ${error.message}`);
                    if (job.attemptsMade + 1 >= job.opts.attempts) {
                        console.error(`[${new Date().toISOString()}] Job ${job.id} has exhausted all ${job.opts.attempts} attempts. Marking as permanently failed.`);
                    } else {
                        console.log(`[${new Date().toISOString()}] Job ${job.id} will be retried. Attempts remaining: ${job.opts.attempts - (job.attemptsMade + 1)}`);
                    }
                    throw error;
                }
            },
            getWorkerOptions(getConnectionOptions()),
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
            console.error('Worker error:', err);
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