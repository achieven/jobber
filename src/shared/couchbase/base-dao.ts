import { Collection, Bucket, Scope, CollectionQueryIndexManager } from 'couchbase';
import { couchbaseManager } from './connection-manager';

export abstract class BaseDAO {
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

    private async ensureInitialized(): Promise<void> {
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
        limit = (limit || (where || groupBy ? '' : 100));
        offset = offset || '';

        const bucket = await this.bucket;
        const query = `SELECT ${fields} 
            FROM ${this.bucketName}.${this.scopeName}.${this.collectionName} 
            ${where   ? `WHERE ${where}`      : where} 
            ${groupBy ? `GROUP BY ${groupBy}` : groupBy} 
            ${orderBy ? `ORDER BY ${orderBy}` : orderBy} 
            ${limit   ? `LIMIT    ${limit}`   : limit} 
            ${offset  ? `LIMIT    ${offset}`  : offset} 
            `
        console.log(query);
        return (await bucket.cluster.query(query)).rows;
    }

    protected async mutateIn(key: string, specs: any[], options?: any): Promise<any> {
        const collection = await this.collection;
        return collection.mutateIn(key, specs, options);
    }

    protected async ensureIndexes(collectionName: string): Promise<void> {
        const collection = await this.collection;
        const indexManager = new CollectionQueryIndexManager(collection);
        await indexManager.createPrimaryIndex({
            ignoreIfExists: true,
            deferred: true
        });
        await indexManager.buildDeferredIndexes();
    }
} 