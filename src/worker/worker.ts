
import { Worker, Job } from 'bullmq';
import { spawn } from 'child_process';
import { getQueueOptions, getWorkerOptions } from '../shared/queue/queue';
import { JOB_STATUS } from '../shared/models/job';
import { setActiveJob, setCompletedJob, setFailedJob } from './database/jobs';
import { getConnectionOptions } from 'src/shared/redis/redis.config';

console.log(`Worker starting, connecting to Redis...`);


const worker = new Worker(
    getQueueOptions().name,
    async (job: Job) => {//TODO organise job id and jobName
        console.log(`[${new Date().toISOString()}] Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts}) with data: ${JSON.stringify(job.data)}`);

        try {
            const result = await executeCppJob(job.name, job.data, job.attemptsMade + 1);
            console.log(`[${new Date().toISOString()}] Job ${job.id} completed successfully. Result: ${result}`);
            return { success: true, result: result };
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Job ${job.id} failed on attempt ${job.attemptsMade + 1}. Error: ${error.message}`);
            if (job.attemptsMade + 1 >= job.opts.attempts) {
                console.error(`[${new Date().toISOString()}] Job ${job.id} has exhausted all ${job.opts.attempts} attempts. Marking as permanently failed.`);
            } else {
                console.log(`[${new Date().toISOString()}] Job ${job.id} will be retried. Attempts remaining: ${job.opts.attempts - (job.attemptsMade + 1)}`);
            }
            throw error;
        }
    },
    getWorkerOptions(getConnectionOptions()),
);

worker.on('progress', async (job: Job, progress: number | object) => {

});

worker.on('active', async (job) => {
    return await setActiveJob(job.id, job.name, JOB_STATUS.ACTIVE, {});
});

worker.on('completed', async (job: Job, returnvalue: any) => {
    return await setCompletedJob(job.id, job.name, JOB_STATUS.COMPLETED, {
        result: job.returnvalue,
    });
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

worker.on('failed', async (job: Job, err: Error) => {
    return await setFailedJob(job.id, job.name, JOB_STATUS.FAILED, {
        error: err.message,
    });
});



async function executeCppJob(jobName: string, jobData: string[], attemptNumber?: number): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`[${new Date().toISOString()}] Spawning C++ process for job: ${jobName} with args: ${JSON.stringify(jobData)} (attempt ${attemptNumber || 'unknown'})`);
        
        const cppProcess = spawn(`${process.cwd()}/dist/worker/jobs/${jobName}`, jobData, {
            cwd: process.cwd(), 
        });
        let stdout = '';
        let stderr = '';

        cppProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`C++ stdout for job ${jobName}: ${data.toString().trim()}`);
        });

        cppProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(`C++ stderr for job ${jobName}: ${data.toString().trim()}`);
        });

        cppProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`C++ process for job ${jobName} exited successfully.`);
                resolve(stdout.trim()); 
            } else {
                const errorMessage = `C++ process for job ${jobName} exited with code ${code}. Stderr: ${stderr.trim()}`;
                console.error(errorMessage);
                // Create a custom error that BullMQ will treat as retryable
                const error = new Error(errorMessage);
                error.name = 'CppProcessError';
                error['code'] = code;
                reject(error);
            }
        });

        cppProcess.on('error', (err) => {
            const errorMessage = `Failed to start C++ process for job ${jobName}: ${err.message}`;
            console.error(errorMessage);
            reject(new Error(errorMessage)); 
        });
    })
}