import { Injectable } from '@nestjs/common';
import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorVectorDAO, getErrorCategoryDocumentId } from '../../shared/couchbase/error-vector-dao';
import { OpenAIService } from '../../shared/vectorization/openai.service';
import { DocumentExistsError } from 'couchbase';

@Injectable()
export class StatsService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly errorVectorDAO: ErrorVectorDAO,
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
    
    async getEmbeddingAndInsert(errorCategory: string) {
        try {
            //TODO checkif exists and otherwise no need to do it and waste openAI calls and insertions catch
            console.log('ErrorVectorDAO: Getting embedding for:', errorCategory);
            const errorVector = await this.openAIService.getEmbedding(errorCategory);
            console.log('ErrorVectorDAO: Got embedding, inserting to database');
            return await this.errorVectorDAO.insertErrorCategory(errorCategory, errorVector);
        } catch (error) {
            if (error instanceof DocumentExistsError) {
                console.log('ErrorVectorDAO: Error inserting error category:', error);
            } else {
                throw error;
            }
        }
    }
}