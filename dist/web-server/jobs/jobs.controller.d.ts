import { Response } from 'express';
import { QueueService } from '../queue/queue.service';
import { JobPayload } from '../../shared/models/job';
export declare class JobsController {
    private readonly queueService;
    constructor(queueService: QueueService);
    postJob(payload: JobPayload, res: Response): Promise<Response<any, Record<string, any>>>;
}
