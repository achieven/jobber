

# Jobber

A distributed job processing platform for executing C++ jobs with robust queue management, monitoring, and persistence capabilities.

## 🚀 Quick Start

## 🔧 Prerequisites

- Docker and Docker Compose
- OPENAI_API_KEY with embeddings capability
    - ## Local development
    - Node.js v18+ (for development, specifically v18 to work with NestJs)


```bash
# Clone the repository
git clone https://github.com/achieven/jobber
cd jobber

# Set up environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Start the system
docker compose up -d

# Wait for Couchbase to initialize (60 seconds)
sleep 60

# Submit your first job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dummy-job",
    "data": {
      "message": "Hello from Jobber!"
    }
  }'
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Quick Start Guide](./docs/getting-started/quick-start.md)** - Get up and running in minutes
- **[System Overview](./docs/architecture/system-overview.md)** - Architecture and components
- **[API Reference](./docs/development/api-reference.md)** - Complete REST API documentation
- **[Job Development](./docs/development/job-development.md)** - Create custom C++ jobs
- **[Deployment Guide](./docs/operations/deployment.md)** - Production deployment

## 🏗️ Architecture

Jobber consists of:

- **Web Server** (port 3000) - REST API for job management
- **Worker** - Processes C++ jobs from the queue
- **Couchbase** 
    - Low-latency Document database for job data storage
    - Hosting error as vectors, for performing the stats part that check success rate per error category (which is being dummy inserted upon startup)
- **Redis** - Acting in multiple roles:
    - Queue, using BullMQ
    - Cache - Storing text pair, for fast, local, check every time the job is failed

## Architecture Agenda

- The local machine hosts the web-server, worker (with it's c++ jobs obviously), and the redis instance.

    - This is due to the real-time nature of wanting to execute jobs immediately as possible

    - CORES_PER_CPP_PROCESS - An environment variable for the number of cores the C++ job should take is set at the worker's docker-compose section

    - The worker divides the number of CPUs in the machine with CORES_PER_CPP_PROCESS, and the result is the worker concurrency. Each job is spawned by the worker using child_process. This setting is a top-limit which helps the OS to avoid unnecessary context swithces, yet uses the maximal concurrency for the worker given this constraint.

    - The nodejs worker, webserver, and even redis, are mainly I/O bound, therefore, they do not utilizing CPU cores extensively, nor we need to consider that to decide the worker concurrency.

- A remote machine hosts couchbase (locally for local development and quick-run)

    - My original idea was to use couchbase as a low-latency, on-premise DB (which mongo can't offer in production, if using the vector search). However, during writing the code I thought again, that this DB shouldn't really be on-premise, within this task's score at least, it's set to retrieve analytics, which are most likely not for real-time usage (unless they are).

    - Given my later reasoning, mongo would have been better, specifically for achieving immutable fields enforced by mongoose, while supporting atomicity and race-condition-proof (which ottoman.js can't do, an neither does the sdk have immutability feature - so only optimistic CAS, which is not the case for short-but-frequent job event updates).



## Local development


- **Install dependencies**: npm i
- **Web Server**: npm run buildWebServer
- **Worker Service**:  npm run buildWorkerAndJobsLocally


## 📝 TODOS



## 📄 License

This project is using enterprise features, not to be used commercially! Only for local development.