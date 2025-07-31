import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueueService } from '../queue/queue.service';
import { JobPayload } from '../queue/queue.service';

@Controller('jobs')
export class JobsController {
    constructor(private readonly queueService: QueueService) {}
    
    @Post('/jobs')
    async postJob(@Body() payload: JobPayload, @Res() res: Response) {
        try {
            if (!payload.jobName || !payload.arguments) {//TODO add real validation
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Input data is required.' });
            }

            const job = await this.queueService.addJobToQueue(payload);
            return res.status(HttpStatus.ACCEPTED).json({
                message: 'Job submitted successfully',
                jobId: job.id,
                status: 'queued',
            });
        } catch (error) {
            console.error('Error submitting job:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to submit job',
                error: error.message,
            });
        }
    }
}
