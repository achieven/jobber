import { MutateInSpec, MutateInResult } from 'couchbase';
import { BaseDAO } from './base-dao';
import { JOB_STATUS } from '../models/job';

export class JobsDAO extends BaseDAO {
    constructor() {
        super('default', '_default', 'jobs');
    }
    async upsertJobEvent(jobId: string, jobName: string, status: JOB_STATUS, data: any): Promise<MutateInResult> {
        const id = `jobEvent:${jobId}:${jobName}`;
        console.log(jobId, jobName, status, data);
        
        const updatedAt =  Date.now();
        
        let mutateInSpecs = [
            MutateInSpec.upsert('jobId', jobId, { createPath: true }), //TODO - could replace existing jobId & jobName, only CAS or niql update can save us
            MutateInSpec.upsert('jobName', jobName, { createPath: true }),  
            MutateInSpec.upsert('status', status, { createPath: true }),
            MutateInSpec.upsert('updatedAt', updatedAt, { createPath: true }),
            MutateInSpec.arrayAppend('events',
                Object.assign({}, data, { 
                    status,
                    updatedAt
                }), { createPath: true }
            )
        ]
        try {
            return await this.mutateIn(id, mutateInSpecs,
            {
                upsertDocument: true
            }
        );
        } catch (error) {
            console.error('Error in upsertJobEvent:', error);//TODO add to errors bucket/collection (preferably collection)
            // throw error;
        }
    }

    async getJobs() {
        const fields = `jobName,
            MAX([updatedAt, TO_NUMBER(jobId), status, events]) as latestInvocation,
            SUM(CASE WHEN status = ${JOB_STATUS.ACTIVE} THEN 1 ELSE 0 END) AS activeCount,
            SUM(CASE WHEN status = ${JOB_STATUS.FAILED} THEN 1 ELSE 0 END) AS failedCount,
            SUM(CASE WHEN status = ${JOB_STATUS.COMPLETED} THEN 1 ELSE 0 END) AS completedCount,
            ARRAY_AGG(jobId) AS allJobIds,
            ARRAY_AGG(CASE WHEN status = ${JOB_STATUS.ACTIVE} THEN ARRAY event for event in events when event.status = ${JOB_STATUS.ACTIVE} END END) AS activeJobs
            `
        return await this.select(
            {
                fields,
                groupBy: 'jobName', 
                orderBy: 'MAX(updatedAt)'
            }
        );
    }
}