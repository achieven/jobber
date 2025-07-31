"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const child_process_1 = require("child_process");
const redis_config_1 = require("../shared/redis/redis.config");
const queue_1 = require("../shared/queue/queue");
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '1', 10);
console.log(`Worker starting, connecting to Redis...`);
console.log(`Worker concurrency set to: ${WORKER_CONCURRENCY}`);
const worker = new bullmq_1.Worker((0, queue_1.getQueueOptions)().name, async (job) => {
    console.log(`[${new Date().toISOString()}] Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts}) with data: ${JSON.stringify(job.data)}`);
    try {
        const result = await executeCppJob(job.name, job.data, job.attemptsMade + 1);
        console.log(`[${new Date().toISOString()}] Job ${job.id} completed successfully. Result: ${result}`);
        return { success: true, result: result };
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] Job ${job.id} failed on attempt ${job.attemptsMade + 1}. Error: ${error.message}`);
        if (job.attemptsMade + 1 >= job.opts.attempts) {
            console.error(`[${new Date().toISOString()}] Job ${job.id} has exhausted all ${job.opts.attempts} attempts. Marking as permanently failed.`);
        }
        else {
            console.log(`[${new Date().toISOString()}] Job ${job.id} will be retried. Attempts remaining: ${job.opts.attempts - (job.attemptsMade + 1)}`);
        }
        throw error;
    }
}, {
    connection: (0, redis_config_1.getConnectionOptions)(),
    concurrency: WORKER_CONCURRENCY,
    limiter: {
        max: 1000,
        duration: 1000
    }
});
worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with error: ${err.message}`);
});
worker.on('error', (err) => {
    console.error('Worker error:', err);
});
async function executeCppJob(jobName, jobData, attemptNumber) {
    return new Promise((resolve, reject) => {
        console.log(`[${new Date().toISOString()}] Spawning C++ process for job: ${jobName} with args: ${JSON.stringify(jobData)} (attempt ${attemptNumber || 'unknown'})`);
        const cppProcess = (0, child_process_1.spawn)(`${process.cwd()}/dist/worker/jobs/${jobName}`, jobData, {
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
            }
            else {
                const errorMessage = `C++ process for job ${jobName} exited with code ${code}. Stderr: ${stderr.trim()}`;
                console.error(errorMessage);
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
    });
}
//# sourceMappingURL=worker.js.map