

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
# For windows users
change the compose.yml entry in couchbase to
  dockerfile: Dockerfile.windows.couchbase
before running the docker compose up command

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

  # Monitiring:

  # Jobs list
  curl http://localhost:3000/jobs

  # Jobs success rate by characteristics
  curl http://localhost:3000/stats
```



## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Architecture and Flow](./docs/architecture/architecture.md)** - Architecture and components

## Troubleshooting

- Couchase not working
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

- Being a real-time environment, the local machine hosts the web-server, worker (with it's c++ jobs obviously), and the redis instance, for lightning-fast on-premise job execution.
- A remote machine hosts couchbase (locally for local development and quick-run) for data management
- More info about this is at the [architecture](./docs/architecture/architecture.md) section


## Local development


- **Install dependencies**: npm i
- **Web Server**: npm run buildWebServer
- **Worker Service**:  npm run buildWorkerAndJobsLocally



## 📄 License

This project is using enterprise features, not to be used commercially! Only for local development.