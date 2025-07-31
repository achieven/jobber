import { RegisterQueueOptions } from "@nestjs/bullmq";

export function getQueueOptions(): RegisterQueueOptions {
    return {
        name: 'my-job-queue',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 10,
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