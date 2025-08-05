import { connect, Cluster, Bucket, Collection, Scope } from 'couchbase';

export interface CouchbaseConfig {
    host: string;
    port: string;
    username: string;
    password: string;
    timeout?: number;
}

export interface BucketConfig {
    ramQuotaMB: number;
    replicaNumber: number;
    evictionPolicy: string;
    compressionMode: string;
    maxTTL: number;
}

class CouchbaseConnectionManager {
    private static instance: CouchbaseConnectionManager;
    private cluster: Cluster | null = null;
    private buckets: Map<string, Bucket> = new Map();
    private collections: Map<string, Collection> = new Map();
    private isInitialized: boolean = false;
    private config: CouchbaseConfig;

    private constructor() {
        this.config = {
            host: process.env.COUCHBASE_HOST || 'localhost',
            port: process.env.COUCHBASE_PORT || '11210', 
            username: process.env.COUCHBASE_USERNAME || 'Administrator',
            password: process.env.COUCHBASE_PASSWORD || 'password',
            timeout: parseInt(process.env.COUCHBASE_TIMEOUT || '10000')
        };
    }

    static getInstance(): CouchbaseConnectionManager {
        if (!CouchbaseConnectionManager.instance) {
            CouchbaseConnectionManager.instance = new CouchbaseConnectionManager();
        }
        return CouchbaseConnectionManager.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('Couchbase connection already initialized');
            return;
        }

        try {
            console.log('Initializing Couchbase connection...');
            console.log('Connection config:', this.config);
            
            this.cluster = await connect(`couchbase://${this.config.host}`, {
                username: this.config.username,
                password: this.config.password,
                timeouts: { 
                    kvTimeout: this.config.timeout,
                    connectTimeout: this.config.timeout,
                    queryTimeout: this.config.timeout
                }
            });
            
            this.isInitialized = true;
            console.log('Couchbase connection initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Couchbase connection:', error);
            console.error('Connection details:', {
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                timeout: this.config.timeout
            });
            throw error;
        }
    }

    async getBucket(bucketName: string): Promise<Bucket> {
        if (!this.isInitialized || !this.cluster) {
            throw new Error('Couchbase not initialized. Call initialize() first.');
        }

        if (this.buckets.has(bucketName)) {
            return this.buckets.get(bucketName)!;
        }

        try {
            console.log(`Getting bucket '${bucketName}'`);
            const bucket = this.cluster.bucket(bucketName);
            this.buckets.set(bucketName, bucket);
            console.log(`Bucket '${bucketName}' connected successfully`);
            return bucket;
        } catch (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
            throw error;
        }
    }

    async getCollection(bucketName: string, scopeName: string = '_default', collectionName: string = '_default'): Promise<Collection> {
        const cacheKey = `${bucketName}:${scopeName}:${collectionName}`;
        console.log(this.collections);
        
        // Check if collection already exists in cache
        if (this.collections.has(cacheKey)) {
            return this.collections.get(cacheKey)!;
        }

        const bucket = await this.getBucket(bucketName);
        const scope = bucket.scope(scopeName);
        console.log(`Getting collection '${collectionName}' in scope '${scopeName}' in bucket '${bucketName}'`);
        const collection = scope.collection(collectionName);
        
        this.collections.set(cacheKey, collection);
        return collection;
    }

    async getScope(bucketName: string, scopeName: string = '_default'): Promise<Scope> {
        const bucket = await this.getBucket(bucketName);
        return bucket.scope(scopeName);
    }

    async close(): Promise<void> {
        if (this.cluster) {
            await this.cluster.close();
            this.cluster = null;
            this.buckets.clear();
            this.collections.clear();
            this.isInitialized = false;
            console.log('Couchbase connection closed');
        }
    }
}

export const couchbaseManager = CouchbaseConnectionManager.getInstance(); 