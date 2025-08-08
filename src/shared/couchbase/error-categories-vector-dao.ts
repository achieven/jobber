import { Injectable } from '@nestjs/common';
import { BaseDAO } from './base-dao';
import { CollectionQueryIndexManager } from 'couchbase';

@Injectable()
export class ErrorCategoriesVectorDAO extends BaseDAO {

    constructor() {
        super('default', '_default', 'errorCategoriesVectors');
    }

    async getErrorCategories() {
        const result = await this.select({
            fields: '*'
        })
        return result.map(row => row[this.collectionName]);
    }

    async getErrorCategory(category: string) {
        const result = await this.select({
            fields: '*',
            where: `category = '${category}'`,
        })
        return result.map(row => row[this.collectionName]);
    }

    async insertErrorCategory(category: string, errorVector: number[]) {
        return await this.insert(category, {
            value: errorVector,
            category
        });
    }

    protected async ensureIndexes() {
        const collection = await this.collection;
        const indexManager = new CollectionQueryIndexManager(collection);
        const indexCreationOptions = {
            ignoreIfExists: true,
            deferred: true
        }

        await indexManager.buildDeferredIndexes();
    }
}
