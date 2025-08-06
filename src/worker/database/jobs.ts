import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';

const jobsDAO = new JobsDAO();


export async function setActiveJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: ActiveJobDetails) {
    await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
}

export async function setCompletedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: CompletedJobDetails) {
    await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
}

export async function setFailedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: FailedJobDetails) {
    await jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
}