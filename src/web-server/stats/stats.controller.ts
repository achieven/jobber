import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorVectorDAO } from '../../shared/couchbase/error-vector-dao';
import { StatsService } from './stats.service';





@Controller('stats')
export class StatsController {
    constructor(
        private readonly jobsDAO: JobsDAO,
        private readonly errorVectorDAO: ErrorVectorDAO,
        private readonly statsService: StatsService,
    ) {}

    @Get('/')
    async getStats(@Res() res: Response) {
        try {
            if (process.env.NODE_ENV === 'local') {
            await this.statsService.insertErrorCategories();
            }
            const errorCategories = await this.errorVectorDAO.getErrorCategories();
            const errorVectorsCount = await this.errorVectorDAO.countErrorVectors();
            console.log(errorVectorsCount)
            console.log(errorCategories)
            let promises = [
                this.jobsDAO.getPerAttemptsStats(),
                this.jobsDAO.getPerConcurrentJobsStats(),
                this.jobsDAO.getErrorCategorySuccessRate(errorCategories, errorVectorsCount)
            ];
            const jobStats = await Promise.all(promises);
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
