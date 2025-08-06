import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorVectorDAO } from '../../shared/couchbase/error-vector-dao';
import { OpenAIService } from '../services/vectorization/openai.service';
import { getTextToVector, setTextToVector } from '../database/redis/textToVector';

const openAIService = new OpenAIService();
const jobsDAO = new JobsDAO();
const errorVectorDAO = new ErrorVectorDAO();

export async function setActiveJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: ActiveJobDetails) {
    await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
}

export async function setCompletedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: CompletedJobDetails) {
    await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
}

export async function setFailedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: FailedJobDetails) {
    jobDetails.error = 'C++ exist error';//TODO remove this, for testing
    const errorMessage = jobDetails.error;
    let vector = await getTextToVector(errorMessage);
    let vectorEmbedding = null;
    let promises = []
    if (!vector) {
        vectorEmbedding = await openAIService.getEmbedding(errorMessage);
        // ideally this would be inserted to a queue for eventual (yet relatively immediate) consistency, possibly even in the upper level of it, even before the redis get, and then a job handles the  vectorization
        // didn't implement it in such a way, since this whole thing is an extra feature altogether, and requires more time which i'm not sure i have
        // upsert is because it's possible that couchase has failed in previous attempt
        // and also, it's very likely that within the window of receiving a response from openai, multiple events are calling this function
        // redis awaits couchbase, since couchbase is the source of truth, and redis is just a cache, since it's local therefore much faster for cache hits, which are the more common case
        await errorVectorDAO.upsertErrorVector(errorMessage, vectorEmbedding);
        promises.push(await setTextToVector(errorMessage, vectorEmbedding));
    }
    promises.push(await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails));
    await Promise.all(promises);
}