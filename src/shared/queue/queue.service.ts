import { Injectable } from '@nestjs/common';
import { RegisterQueueOptions } from "@nestjs/bullmq";
import { ConnectionOptions, WorkerOptions } from "bullmq";
import { cpus } from 'os';
import { getConnectionOptions } from '../redis/redis.config';

@Injectable()
export class QueueConfigService {
    static readonly QUEUE_NAME = 'my-job-queue';

    getQueueOptions(): RegisterQueueOptions {
        return {
            name: QueueConfigService.QUEUE_NAME,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: {
                    age: 3600, 
                    count: 1000,
                },
                removeOnFail: {
                    age: 24 * 3600,
                }
            },
        };
    }

    getWorkerOptions(connection?: ConnectionOptions): WorkerOptions {
        const connectionOptions = connection || getConnectionOptions() as ConnectionOptions;
        const cpuCount = cpus().length;
        const coresPerCppProcess = process.env.CORES_PER_CPP_PROCESS ? parseInt(process.env.CORES_PER_CPP_PROCESS) : 1;
        const WORKER_CONCURRENCY = Math.floor(cpuCount / coresPerCppProcess);

        return {
            connection: connectionOptions,
            concurrency: WORKER_CONCURRENCY,
            limiter: {
                max: 1000,
                duration: 1000
            },
        };
    }
}
