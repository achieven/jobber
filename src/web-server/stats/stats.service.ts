import { Injectable } from '@nestjs/common';
import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorCategoriesVectorDAO } from '../../shared/couchbase/error-categories-vector-dao';
import { OpenAIService } from '../../shared/vectorization/openai.service';
import { DocumentExistsError } from 'couchbase';

@Injectable()
export class StatsService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly errorCategoriesVectorDAO: ErrorCategoriesVectorDAO,
    ) {}

    async insertErrorCategories() {
        const errorCategories = [
            'C++ error',
            'Javascript error',
            'Image processing error',
            'Memory quota exceeded',
            'Timeout'
        ]

        for (const errorCategory of errorCategories) {
            await this.getEmbeddingAndInsert(errorCategory);
        }
    }
    
    private async getEmbeddingAndInsert(errorCategory: string) {
        try {
            const errorCategoryExists = await this.errorCategoriesVectorDAO.getErrorCategory(errorCategory);
            if (errorCategoryExists) {
                console.log('ErrorVectorDAO: Error category already exists');
                return;
            }
            console.log('ErrorVectorDAO: Getting embedding for:', errorCategory);
            const errorVector = await this.openAIService.getEmbedding(errorCategory);
            console.log('ErrorVectorDAO: Got embedding, inserting to database');
            return await this.errorCategoriesVectorDAO.insertErrorCategory(errorCategory, errorVector);
        } catch (error) {
            if (error instanceof DocumentExistsError) {
                console.log('ErrorVectorDAO: Error inserting error category:', error);
            } else {
                throw error;
            }
        }
    }
}