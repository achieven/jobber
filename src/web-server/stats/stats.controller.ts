import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorCategoriesDAO } from '../../shared/couchbase/error-categories-dao';
import { OpenAIService } from '../../worker/services/vectorization/openai.service';

const openaiService = new OpenAIService();
const jobsDAO = new JobsDAO();
const errorCategoriesDAO = new ErrorCategoriesDAO();




@Controller('stats')
export class StatsController {

    @Get('/')
    async getStats(@Res() res: Response) {
        try {
            const errorCategories = await errorCategoriesDAO.getErrorCategories();
            let promises = [];
            for (const errorCategory of errorCategories) {
                promises.push(openaiService.getEmbedding(errorCategory.errorCategories.name));
            }
            const errorCategoryVectors = await Promise.all(promises);
            const jobStats = await jobsDAO.getStats(errorCategoryVectors);
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
