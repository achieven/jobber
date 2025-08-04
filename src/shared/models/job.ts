import { IsString, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export const enum JOB_STATUS {
    COMPLETED = 'completed',
    FAILED = 'failed',
    WAITING = 'waiting',
    ACTIVE = 'active',
    STALLED = 'stalled',
}

interface BaseJobDetails {
}

export interface ActiveJobDetails extends BaseJobDetails {}

export interface CompletedJobDetails extends BaseJobDetails {
    result: any;
}

export interface FailedJobDetails extends BaseJobDetails {
    error: any; 
}


export type JobDetails = CompletedJobDetails | FailedJobDetails | ActiveJobDetails;

export class JobPayload {
    @IsString()
    @IsNotEmpty()
    jobName: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    arguments: string[];
}