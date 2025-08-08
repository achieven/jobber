import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueConfigService } from '../../shared/queue/queue.service';
import { JobPayload } from '../../shared/models/job';

@Injectable()
export class QueueService {
    constructor(
        @InjectQueue(QueueConfigService.QUEUE_NAME) private myJobQueue: Queue
    ) {}

    async addJobToQueue(payload: JobPayload) {
        const job = await this.myJobQueue.add(payload.jobName, payload.arguments);
        console.log(`Job ${job.id} added to queue with data: ${JSON.stringify(payload)}`);
        return job;
    }

    async getJobs() {
        const job = await this.myJobQueue.getJobs();
        return job;
    }
}

