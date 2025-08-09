import { Injectable } from '@nestjs/common';
import { Collection, Bucket, Scope, IndexExistsError } from 'couchbase';
import { couchbaseManager } from './connection-manager';

@Injectable()
export abstract class BaseDAO {
    protected DEFAULT_LIMIT: number = 100;
    protected NO_LIMIT: string = 'no limit';


    protected bucketName: string;
    protected scopeName: string;
    protected collectionName: string;
    protected _collection: Collection | null = null;
    protected _bucket: Bucket | null = null;
    protected _scope: Scope | null = null;

    protected isInitialized: boolean = false;

    constructor(bucketName: string, scopeName: string = '_default', collectionName: string = '_default') {
        this.bucketName = bucketName;
        this.scopeName = scopeName;
        this.collectionName = collectionName;
    }

    protected async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            try {
                await couchbaseManager.initialize();
                this.ensureIndexes(this.collectionName);
                this.isInitialized = true;
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
        // console.log(query);
        return (await bucket.cluster.query(query)).rows;
    }

    protected async upsert(key: string, value: any) {
        const collection = await this.collection;
        console.log(this.collectionName,'upserting', key);
        return collection.upsert(key, value);
    }

    protected async insert(key: string, value: any) {
        const collection = await this.collection;
        console.log(this.collectionName,'inserting', key);
        return collection.insert(key, value);
    }

    protected async mutateIn(key: string, specs: any[], options?: any): Promise<any> {
        const collection = await this.collection;
        console.log(this.collectionName,'mutateIn', key);
        return collection.mutateIn(key, specs, options);
    }

    protected async ensureIndexes(collectionName: string): Promise<void> {}

    
    /*
    Sdk doesn't seem to handle array indexes and treats it like a field index, with backticks surrounding the index name.
    Slso, creation using cluster.query seems to be throwing an error the index already exists, even if it isn't, so we're catching it.
    */ 
    protected async createArrayIndex(indexName:string, keys: string) {
        try {
            const buildIndexQuery = `CREATE INDEX ${indexName} ON ${this.bucketScopeCollection} ${keys} WITH {"defer_build": true}`
            await (await this.bucket).cluster.query(buildIndexQuery);
        } catch (error) {
            if (!(error instanceof IndexExistsError)) {
                throw error;
            }
            await this.waitTillIndexCreation();
        }
    }

    async waitTillIndexCreation() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        })
    }
} 


