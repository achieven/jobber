import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    
    console.log('Worker application started');
    

    process.on('SIGINT', async () => {
        console.log('Shutting down worker...');
        await app.close();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('Shutting down worker...');
        await app.close();
        process.exit(0);
    });
}

bootstrap().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
}); 