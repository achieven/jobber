import { Injectable } from '@nestjs/common';
import { InjectQueue, RegisterQueueOptions } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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

export interface JobPayload {
    jobName: string;
    arguments: string[];
}

@Injectable()
export class QueueService {
    constructor(@InjectQueue(getQueueOptions().name) private myJobQueue: Queue) {}

    async addJobToQueue(payload: JobPayload) {
        const job = await this.myJobQueue.add(payload.jobName, payload.arguments);
        console.log(`Job ${job.id} added to queue with data: ${JSON.stringify(payload)}`);
        return job;
      }

}
