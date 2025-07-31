import { Queue } from 'bullmq';
import { JobPayload } from '../../shared/models/job';
export declare class QueueService {
    private myJobQueue;
    constructor(myJobQueue: Queue);
    addJobToQueue(payload: JobPayload): Promise<import("bullmq").Job<any, any, string>>;
}
