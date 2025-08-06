import { MutateInSpec, MutateInResult } from 'couchbase';
import { BaseDAO } from './base-dao';
import { JOB_STATUS } from '../models/job';

const getErrorVectorDocumentId = (jobId: string, jobName: string) => `errorVector:${jobId}:${jobName}`;

export class ErrorVectorDAO extends BaseDAO {
    constructor() {
        super('default', '_default', 'errorVectors');
    }

    async upsertErrorVector(errorMessage: string, errorVector: number[]) {
        console.log(errorMessage, errorVector)
        return await this.upsert(errorMessage, {
            value: errorVector
        });
    }

}