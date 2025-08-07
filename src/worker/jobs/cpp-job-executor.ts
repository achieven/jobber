import { spawn } from 'child_process';

export async function executeCppJob(jobName: string, jobData: string[], attemptNumber?: number): Promise<string> {
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
                reject(error);
            }
        });

        cppProcess.on('error', (error) => {
            console.error(`Failed to start C++ process for job ${jobName}:`, error);
            reject(error);
        });
    });
} 