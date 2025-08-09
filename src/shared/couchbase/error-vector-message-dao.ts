import { Injectable } from '@nestjs/common';
import { BaseDAO } from './base-dao';
import { CollectionQueryIndexManager, IndexExistsError, SearchIndex, SearchIndexManager } from 'couchbase';

@Injectable()
export class ErrorVectorMessageDAO extends BaseDAO {

    constructor() {
        super('default', '_default', 'errorMessageVectors');
    }

    async upsertErrorVector(errorMessage: string, errorVector: number[]) {
        return await this.upsert(errorMessage, {
            value: errorVector,
            text: errorMessage
        });
    }

    protected async ensureIndexes() {
        const collection = await this.collection;
        const indexManager = new CollectionQueryIndexManager(collection);
        const indexCreationOptions = {
            ignoreIfExists: true,
            deferred: true
        }
        
        await this.createSearchIndex();

        await indexManager.buildDeferredIndexes();
    }

    async createSearchIndex() {
        const searchIndexManager = new SearchIndexManager((await this.bucket).cluster);

        try {
            await searchIndexManager.upsertIndex({
                "type": "fulltext-index",
                "name": "error_message_vector_index",
                "sourceType": "gocbcore",
                "sourceName": "default",
                "sourceUuid": "d5cd54347946596faa9e2fc4b4385496",
                "planParams": {
                  "maxPartitionsPerPIndex": 1024,
                  "indexPartitions": 1
                },
                "params": {
                  "doc_config": {
                    "docid_prefix_delim": "",
                    "docid_regexp": "",
                    "mode": "scope.collection.type_field",
                    "type_field": "type"
                  },
                  "mapping": {
                    "analysis": {},
                    "default_analyzer": "standard",
                    "default_datetime_parser": "dateTimeOptional",
                    "default_field": "_all",
                    "default_mapping": {
                      "dynamic": false,
                      "enabled": false
                    },
                    "default_type": "_default",
                    "docvalues_dynamic": false,
                    "index_dynamic": false,
                    "store_dynamic": false,
                    "type_field": "_type",
                    "types": {
                      "_default.errorMessageVectors": {
                        "dynamic": false,
                        "enabled": true,
                        "properties": {
                          "value": {
                            "dynamic": false,
                            "enabled": true,
                            "fields": [
                              {
                                "dims": 1536,
                                "index": true,
                                "name": "value",
                                "similarity": "dot_product",
                                "type": "vector",
                                "vector_index_optimized_for": "recall"
                              }
                            ]
                          }
                        }
                      }
                    }
                  },
                  "store": {
                    "indexType": "scorch",
                    "segmentVersion": 16
                  }
                },
                "sourceParams": {}
            })

        } catch (error) {
            if (!(error instanceof IndexExistsError)) {
                throw error;
            }
            await this.waitTillIndexCreation();
        }
    }
}
