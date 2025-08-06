import { MutateInSpec, MutateInResult } from 'couchbase';
import { BaseDAO } from './base-dao';
import { JOB_STATUS } from '../models/job';

const getJobDocumentId = (jobId: string, jobName: string) => `jobEvent:${jobId}:${jobName}`;

export class JobsDAO extends BaseDAO {
    constructor() {
        super('default', '_default', 'jobs');
    }
    
    async upsertJobEvent(jobId: string, jobName: string, jobData: any[], status: JOB_STATUS, data: any): Promise<MutateInResult> {
        console.log(jobId, jobName, status, data);
        
        const updatedAt = Date.now();
        //TODO - 
        // while it's race-condition-proof due to mutateIn being atmic and internally-locked, 
        // it could accidentally replace existing jobId & jobName, 
        // only optimistic deciding that the active will be the first event (which could be the decision to make)
        //  or niql update with ignoring change if field is set can help (but will not throw error in caes of developer error)
        // ottomanjs immutable isn't suitable because it's still using CAS (unless we optimistically insert/update accordingly)
        // (or moving to mongo)
        
        let mutateInSpecs = [
            MutateInSpec.upsert('jobId', jobId, { createPath: true }), 
            MutateInSpec.upsert('jobName', jobName, { createPath: true }),
            MutateInSpec.upsert('data', jobData, { createPath: true }),
            MutateInSpec.upsert('status', status, { createPath: true }),
            MutateInSpec.upsert('updatedAt', updatedAt, { createPath: true }),
            MutateInSpec.arrayAppend(
                'events',
                Object.assign({}, data, { 
                    status,
                    updatedAt
                }), 
                { createPath: true }
            )
        ];

        if (status === JOB_STATUS.ACTIVE) { 
            mutateInSpecs.push(
                MutateInSpec.increment('attempts', 1, { createPath: true })
            )
        }
        
        try {
            const id = getJobDocumentId(jobId, jobName);
            return await this.mutateIn(id, mutateInSpecs, {
                upsertDocument: true
            });
        } catch (error) {
            console.error('Error in upsertJobEvent:', error);//TODO add to errors bucket/collection (preferably collection)
            // throw error;
        }
    }

    async getJobs() {
        // TODO return as object in MAX instead of array
        const fields = `jobName,
            MAX([updatedAt, TO_NUMBER(jobId), status, events]) as latestInvocation, 
            SUM(CASE WHEN status = '${JOB_STATUS.ACTIVE}' THEN 1 ELSE 0 END) AS activeCount,
            SUM(CASE WHEN status = '${JOB_STATUS.FAILED}' THEN 1 ELSE 0 END) AS failedCount,
            SUM(CASE WHEN status = '${JOB_STATUS.COMPLETED}' THEN 1 ELSE 0 END) AS completedCount,
            ARRAY_AGG(jobId) AS allJobIds,
            ARRAY_AGG(CASE WHEN status = '${JOB_STATUS.ACTIVE}' THEN ARRAY event for event in events when event.status = '${JOB_STATUS.ACTIVE}' END END) AS activeJobs
            `
        return await this.select(
            {
                fields,
                groupBy: 'jobName', 
                orderBy: 'MAX(updatedAt)'
            }
        );
    }

    async getStats() {
        const bucketScopeCollection = `${this.bucketName}.${this.scopeName}.${this.collectionName}`;
        const successRateAs = 'successRatePercentage';
        const sumCompletedJobsAs = 'completedJobs';
        const whatToCount = Math.random().toString();
        const successRatePercentageAsField = `ROUND(SUM(CASE WHEN status = '${JOB_STATUS.COMPLETED}' THEN 1 ELSE 0 END) * 100.0 / COUNT(${whatToCount}), 2) AS ${successRateAs}`
        const sumCompletedJobsAsField = `SUM(CASE WHEN status = '${JOB_STATUS.COMPLETED}' THEN 1 ELSE 0 END) AS ${sumCompletedJobsAs}`
        
        const perAttemptsStatsQuery = `
            SELECT 
                t1.attempts AS attemptsUpTo,
                (SELECT 
                    COUNT(t2) as countTotalJobs
                FROM 
                    ${bucketScopeCollection} AS t2
                WHERE
                    t2.attempts >= t1.attempts
                )[0].countTotalJobs 
                AS totalJobsUpTo,

                (SELECT 
                    ${sumCompletedJobsAsField}
                FROM 
                    ${bucketScopeCollection} AS t2
                WHERE
                    t2.attempts >= t1.attempts
                )[0].${sumCompletedJobsAs}
                AS completedJobsUpTo,

                (SELECT
                    ${successRatePercentageAsField.replaceAll(whatToCount, '*')}
                FROM
                    ${bucketScopeCollection} AS t2
                WHERE
                    t2.attempts >= t1.attempts
                )[0].${successRateAs}
                AS ${successRateAs}
            FROM (
                SELECT 
                    DISTINCT attempts
                FROM 
                    ${bucketScopeCollection}
                WHERE 
                    attempts IS NOT MISSING
            ) 
            AS t1
            ORDER BY 
                t1.attempts
        `
        

        const perConcurrentJobsQuery = `
            WITH JobTimeWindows AS (
                -- Step 1: Calculate the active time window for each job.
                -- The active window is defined from the first 'active' event's updatedAt
                -- to the root job document's updatedAt (meaning, it's the gross time, not the net execution time)
                SELECT
                    d.jobId,
                    d.jobName,
                    d.status, -- Root status of the job
                    d.updatedAt AS rootUpdatedAt,
                    (SELECT MIN(e.updatedAt) as startTime FROM d.events AS e WHERE e.status = '${JOB_STATUS.ACTIVE}')[0].startTime AS firstActiveEventUpdatedAt
                FROM 
                    ${bucketScopeCollection} AS d
                WHERE
                    d IS NOT MISSING
                    AND d.events IS NOT MISSING
                    AND ARRAY_COUNT(d.events) > 0
                    AND (ANY e IN d.events SATISFIES e.status = '${JOB_STATUS.ACTIVE}' END) -- Ensure there's at least one active event
            ),
            ConcurrentPairs AS (
                -- Step 2: Identify pairs of concurrently running jobs.
                -- Two jobs are concurrent if their time windows (firstActiveEventUpdatedAt to rootUpdatedAt) overlap.
                -- We use j1.jobId < j2.jobId to avoid self-joins and duplicate pairs.
                SELECT
                    j1.jobId AS job1Id,
                    j2.jobId AS job2Id
                FROM 
                    JobTimeWindows AS j1
                JOIN 
                    JobTimeWindows AS j2
                ON 
                    j1.jobId < j2.jobId
                    AND j1.firstActiveEventUpdatedAt IS NOT MISSING AND j1.rootUpdatedAt IS NOT MISSING
                    AND j2.firstActiveEventUpdatedAt IS NOT MISSING AND j2.rootUpdatedAt IS NOT MISSING
                    -- Standard temporal overlap condition: (start1 <= end2 AND start2 <= end1)
                    AND j1.firstActiveEventUpdatedAt <= j2.rootUpdatedAt
                    AND j2.firstActiveEventUpdatedAt <= j1.rootUpdatedAt
            ),
            ConcurrentJobs AS (
                -- Step 3: Get a distinct list of all job IDs that were part of any concurrent run.
                SELECT j.jobId
                FROM (
                    SELECT DISTINCT cp.job1Id AS jobId FROM ConcurrentPairs AS cp
                    UNION ALL -- UNION ALL is used here for simplicity, DISTINCT is applied in the outer SELECT
                    SELECT DISTINCT cp.job2Id AS jobId FROM ConcurrentPairs AS cp
                ) AS j
            )
            -- Step 4: Calculate the success rate for the identified concurrent jobs.
            SELECT
                COUNT(jtw.jobId) AS totalConcurrentJobs,
                ${sumCompletedJobsAsField.replaceAll('status', 'jtw.status')},
                ${successRatePercentageAsField.replaceAll(whatToCount, 'jtw').replaceAll('status', 'jtw.status')}
            FROM JobTimeWindows AS jtw
            JOIN ConcurrentJobs AS cj ON jtw.jobId = cj.jobId
            --
        `

        let promises = [
            this.selectRaw(perAttemptsStatsQuery),
            this.selectRaw(perConcurrentJobsQuery)
        ];


        //averate duration, average retries
        //success rate per retries (0/1/2) - done
        //success rate per concurrent jobs vs non concurrent jobs - done
        //success rate per duration (0-10ms, 10-20ms, ... 90-10ms, ...)
        //success rate per jobName
        //success rate per error message
        //success rate per analysts asking questions (e.g analyst asks: "was there a job that failed with c++ error"? -> searches in the error messages and checks similar values)
        return await Promise.all(promises);
    }
}