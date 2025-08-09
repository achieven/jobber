import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorCategoriesVectorDAO } from '../../shared/couchbase/error-categories-vector-dao';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(
        private readonly jobsDAO: JobsDAO,
        private readonly errorCategoriesVectorDAO: ErrorCategoriesVectorDAO,
        private readonly statsService: StatsService,
    ) {}

    @Get('/')
    async getStats(@Res() res: Response) {
        try {
            if (process.env.NODE_ENV === 'local') {
                await this.statsService.insertErrorCategories();
            }
            const errorCategories = await this.errorCategoriesVectorDAO.getErrorCategories();
            let promises = [
                this.jobsDAO.getPerAttemptsStats(),
                this.jobsDAO.getPerConcurrentJobsStats(),
                this.jobsDAO.getErrorCategorySuccessRate(errorCategories)
            ];
            const jobStatsPromises = await Promise.all(promises);
            const jobStats = {
                perAttemptsStats: jobStatsPromises[0],
                perConcurrentJobsStats: jobStatsPromises[1][0],
                errorCategorySuccessRate: jobStatsPromises[2].map((categoryStats) => {
                    const category = categoryStats[0];
                    const categoryName = category.errorCategory;
                    delete category.errorCategory;
                    return {
                        [categoryName]: category
                    }
                })
            }
            return res.status(HttpStatus.ACCEPTED).json({
                jobStats
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
