import { Injectable } from '@nestjs/common';
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
            'Timeout',
            'Null pointer exception',
        ]

        for (const errorCategory of errorCategories) {
            await this.getEmbeddingAndInsert(errorCategory);
        }
    }
    
    private async getEmbeddingAndInsert(errorCategory: string) {
        try {
            const errorCategoryExists = (await this.errorCategoriesVectorDAO.getErrorCategory(errorCategory)).length > 0;
            console.log('errorCategoryExists', errorCategoryExists);
            if (errorCategoryExists) {
                return;
            }
            const errorVector = await this.openAIService.getEmbedding(errorCategory);
            return await this.errorCategoriesVectorDAO.insertErrorCategory(errorCategory, errorVector);
        } catch (error) {
            if (!(error instanceof DocumentExistsError)) {
                throw error;
            }
        }
    }
}