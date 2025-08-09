import { Injectable } from '@nestjs/common';
import { JOB_STATUS, ActiveJobDetails, CompletedJobDetails, FailedJobDetails } from '../../shared/models/job';
import { JobsDAO } from '../../shared/couchbase/jobs-dao';
import { ErrorVectorMessageDAO } from '../../shared/couchbase/error-vector-message-dao';
import { OpenAIService } from '../../shared/vectorization/openai.service';
import { TextToVectorService } from '../../shared/vectorization/text-to-vector.service';

@Injectable()
export class JobsService {
    constructor(
        private readonly openAIService: OpenAIService,
        private readonly jobsDAO: JobsDAO,
        private readonly errorVectorMessageDAO: ErrorVectorMessageDAO,
        private readonly textToVectorService: TextToVectorService,
    ) {}

    async setActiveJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: ActiveJobDetails) {
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
    }

    async setCompletedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: CompletedJobDetails) {
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails);
    }

    async setFailedJob(jobId: string, jobName: string, jobData: any[], jobStatus: JOB_STATUS, jobDetails: FailedJobDetails) {
        await this.jobsDAO.upsertJobEvent(jobId, jobName, jobData, jobStatus, jobDetails)
        const errorMessage = jobDetails.error;
        let cacheHit = await this.textToVectorService.checkTextCacheHit(errorMessage);
        let vectorEmbedding = null;
        if (!cacheHit) {
            vectorEmbedding = await this.openAIService.getEmbedding(errorMessage);

            await this.errorVectorMessageDAO.upsertErrorVector(errorMessage, vectorEmbedding);
            await this.textToVectorService.setTextCache(errorMessage)
        }
    }
}