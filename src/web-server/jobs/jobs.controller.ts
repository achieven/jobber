import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueueService } from '../queue/queue.service';
import { JobPayload } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';

const jobsDAO = new JobsDAO();

@Controller('jobs')
export class JobsController {
    constructor(private readonly queueService: QueueService) {}
    
    @Post('/')
    async postJob(@Body() payload: JobPayload, @Res() res: Response) {
        try {
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

    @Get('/')
    async getJobs(@Res() res: Response) {
        try {
            const jobs = await jobsDAO.getJobs();
            return res.status(HttpStatus.ACCEPTED).json({
                jobs
            });
        } catch (error) {
            console.error('Error submitting job:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to get jobs',
                error: error.message,
            });
        }
    }
}
