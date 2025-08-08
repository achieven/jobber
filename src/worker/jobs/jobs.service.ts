import { Injectable } from '@nestjs/common';
import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorVectorMessageDAO } from '../../shared/couchbase/error-vector-message-dao';
import { OpenAIService } from '../../shared/vectorization/openai.service';
import { checkTextCacheHit, setTextCache } from '../database/redis/textToVector';

@Injectable()
export class JobsService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly jobsDAO: JobsDAO,
        private readonly errorVectorMessageDAO: ErrorVectorMessageDAO,
    ) {}

    async setActiveJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: ActiveJobDetails) {
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
    }

    async setCompletedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: CompletedJobDetails) {
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
    }

    async setFailedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: FailedJobDetails) {
        // jobDetails.error = 'cant read property of undefined';//TODO remove this, it's just for testing
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails)
        const errorMessage = jobDetails.error;
        let vector = await checkTextCacheHit(errorMessage);
        let vectorEmbedding = null;
        if (!vector) {
            vectorEmbedding = await this.openAIService.getEmbedding(errorMessage);
            // ideally this would be inserted to a queue, or more accurately pub-sub (we could even also include the addition of job event to the subscribers list) for eventual (yet relatively immediate) consistency, possibly even in the upper level of it, even before the redis get, and then a job handles the  vectorization
            // didn't implement it in such a way, since this whole thing is an extra feature altogether, and requires more time which i'm not sure i have
            // upsert is because it's possible that couchase has failed in previous attempt
            // but more than that, it's very likely that within the window of receiving a response from openai, multiple events are calling this function, and get the embeddings concurrently, so it's a race condition.
            // redis awaits couchbase, since couchbase is the source of truth, and redis is just a cache, since it's local therefore much faster for cache hits, which are the more common case
            // has we not awaited couchbase, a possible scenario is that redis inserted the vector, and that's it for couchbase - it won't ever be inserted, since couchbase upserts it based on the redis result (hence the more logical pub-sub architecture)
            await this.errorVectorMessageDAO.upsertErrorVector(errorMessage, vectorEmbedding);
            await setTextCache(errorMessage, true)
        }
    }
}