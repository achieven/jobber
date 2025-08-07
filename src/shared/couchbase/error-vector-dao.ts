import { Injectable } from '@nestjs/common';
import { BaseDAO } from './base-dao';

const errorCategoryType = 'errorCategory';
export const getErrorCategoryDocumentId = (category: string) => `errorCategory:${category}`;

@Injectable()
export class ErrorVectorDAO extends BaseDAO {

    constructor() {
        super('default', '_default', 'errorVectors');
    }

    async countErrorVectors() {
        const result = await this.select({
            fields: 'COUNT(*) as count'
        })
        return result[0].count;
    }

    async getErrorCategories(limit: number = 10) {
        const result = await this.select({
            fields: '*',
            where: `type = '${errorCategoryType}'`,
            limit
        })
        return result.map(row => row[this.collectionName]);
    }

    //in both below functions (upsertErrorVector, upsertErrorCategory), ideally the key would be a hash and not the original text, to reduce memory usage. currently postponing due to time constraints.
    async upsertErrorVector(errorMessage: string, errorVector: number[]) {
        console.log(errorMessage, errorVector)
        return await this.upsert(errorMessage, {
            type: 'errorMessage',
            value: errorVector
        });
    }

    async upsertErrorCategory(category: string, errorVector: number[]) {
        console.log(category, errorVector)
        return await this.upsert(getErrorCategoryDocumentId(category), {
            type: errorCategoryType,
            value: errorVector,
            category
        });
    }

    //only used in local upon startup to insert error categories data
    async insertErrorCategory(category: string, errorVector: number[]) {
        return await this.insert(getErrorCategoryDocumentId(category), {
            type: errorCategoryType,
            value: errorVector,
            category
        });
    }
}