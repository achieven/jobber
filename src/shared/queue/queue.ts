import { RegisterQueueOptions } from "@nestjs/bullmq";
import { cpus } from 'os';
import { ConnectionOptions, WorkerOptions } from "bullmq";

export function getQueueOptions(): RegisterQueueOptions {
    return {
        name: 'my-job-queue',
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

export function getWorkerOptions(connection: ConnectionOptions): WorkerOptions {
    const cpuCount = cpus().length;
    const coresPerCppProcess = process.env.CORES_PER_CPP_PROCESS ? parseInt(process.env.CORES_PER_CPP_PROCESS) : 1;
    const WORKER_CONCURRENCY = Math.floor(cpuCount / coresPerCppProcess);

    return {
        connection,
        concurrency: WORKER_CONCURRENCY,
        limiter: {
            max: 1000,
            duration: 1000
        },
    };
}
