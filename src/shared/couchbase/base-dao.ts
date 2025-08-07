import { Injectable } from '@nestjs/common';
import { Collection, Bucket, Scope, CollectionQueryIndexManager, IndexExistsError } from 'couchbase';
import { couchbaseManager } from './connection-manager';

@Injectable()
export abstract class BaseDAO {
    protected DEFAULT_LIMIT: number = 100;
    protected NO_LIMIT: string = 'no limit';

    private static isInitialized = false;

    protected bucketName: string;
    protected scopeName: string;
    protected collectionName: string;
    protected _collection: Collection | null = null;
    protected _bucket: Bucket | null = null;
    protected _scope: Scope | null = null;

    constructor(bucketName: string, scopeName: string = '_default', collectionName: string = '_default') {
        this.bucketName = bucketName;
        this.scopeName = scopeName;
        this.collectionName = collectionName;
    }

    protected async ensureInitialized(): Promise<void> {
        console.log(BaseDAO.isInitialized)
        if (!BaseDAO.isInitialized) {
            try {
                await couchbaseManager.initialize();
                this.ensureIndexes(this.collectionName);
                BaseDAO.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize Couchbase connection:', error);
                throw error;
            }
        }
    }

    // Getter properties - accessible as fields but with lazy loading
    get collection(): Promise<Collection> {
        return this.getCollectionInternal();
    }

    get bucket(): Promise<Bucket> {
        return this.getBucketInternal();
    }

    get scope(): Promise<Scope> {
        return this.getScopeInternal();
    }

    get bucketScopeCollection(): string {
        return `${this.bucketName}.${this.scopeName}.${this.collectionName}`;
    }

    private async getCollectionInternal(): Promise<Collection> {
        if (!this._collection) {
            await this.ensureInitialized();
            this._collection = await couchbaseManager.getCollection(this.bucketName, this.scopeName, this.collectionName);
        }
        return this._collection;
    }

    private async getBucketInternal(): Promise<Bucket> {
        if (!this._bucket) {
            await this.ensureInitialized();
            this._bucket = await couchbaseManager.getBucket(this.bucketName);
        }
        return this._bucket;
    }

    private async getScopeInternal(): Promise<Scope> {
        if (!this._scope) {
            await this.ensureInitialized();
            this._scope = await couchbaseManager.getScope(this.bucketName, this.scopeName);
        }
        return this._scope;
    }

    protected async select(options: { fields: string, where?: string, groupBy?: string, orderBy?: string, limit?: number | string, offset?: number | string }): Promise<any> {
        let { fields, where, groupBy, orderBy, limit, offset } = options;
        fields = fields || '*';
        where = where || '';
        groupBy = groupBy || '';
        orderBy = orderBy || '';
        limit = (
            limit && limit !== this.NO_LIMIT ? limit :
            (where || groupBy || this.NO_LIMIT === limit) ? '' :
            this.DEFAULT_LIMIT
        );
        offset = offset || '';

        const bucket = await this.bucket;
        const query = `SELECT ${fields} 
            FROM ${this.bucketScopeCollection} 
            ${where   ? `WHERE ${where}`      : where} 
            ${groupBy ? `GROUP BY ${groupBy}` : groupBy} 
            ${orderBy ? `ORDER BY ${orderBy}` : orderBy} 
            ${limit   ? `LIMIT    ${limit}`   : limit} 
            ${offset  ? `LIMIT    ${offset}`  : offset} 
            `
        console.log(query);
        return (await bucket.cluster.query(query)).rows;
    }

    protected async selectRaw(query: string): Promise<any> {
        const bucket = await this.bucket;
        console.log(query);
        return (await bucket.cluster.query(query)).rows;
    }

    protected async upsert(key: string, value: any) {
        const collection = await this.collection;
        return collection.upsert(key, value);
    }

    protected async insert(key: string, value: any) {
        const collection = await this.collection;
        return collection.insert(key, value);
    }

    protected async mutateIn(key: string, specs: any[], options?: any): Promise<any> {
        const collection = await this.collection;
        return collection.mutateIn(key, specs, options);
    }

    protected async ensureIndexes(collectionName: string): Promise<void> {
        const collection = await this.collection;
        const indexManager = new CollectionQueryIndexManager(collection);
        const indexCreationOptions = {
            ignoreIfExists: true,
            deferred: true
        }

        await indexManager.createIndex('jobs_summary', 
            ['jobName',  'updatedAt DESC', 'TO_NUMBER(jobId) DESC', 'status', 'events'],
            indexCreationOptions
        );

        await indexManager.createIndex('jobs_per_attempts', 
            ['attempts',  'status'],
            indexCreationOptions
        );

        await this.createArrayIndexes();

        await indexManager.buildDeferredIndexes();
    }

    async createArrayIndexes() {
        try {
            await (await this.bucket).cluster.query(
                `CREATE INDEX job_start_time ON ${this.bucketName}.${this.scopeName}.${this.collectionName} (DISTINCT ARRAY e.status FOR e IN events END, ARRAY_COUNT(events)) WITH {"defer_build": true}`
            );
        } catch (error) {
            if (!(error instanceof IndexExistsError)) {
                throw error;
            }
            await waitTillIndexCreation();
        }
    }
} 

//sdk doesn't seem to handle array indexes and treats it like a field index, with backticks surrounding
//also, creation using cluster.query seems to be throwing an error the index already exists, even if it isn't, so we're catching it


async function waitTillIndexCreation() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, 10000);
    })
}