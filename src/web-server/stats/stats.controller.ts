import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
const jobsDAO = new JobsDAO();




@Controller('stats')
export class StatsController {

    @Get('/')
    async getStats(@Res() res: Response) {
        try {
            const jobStats = await jobsDAO.getStats();
            return res.status(HttpStatus.ACCEPTED).json({
                stats: {
                    jobStats: jobStats
                }
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
