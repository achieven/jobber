# Quick Start Guide

Get Jobber up and running in under 5 minutes.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- OPENAI_API_KEY with embeddings capability

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd jobber
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (defaults shown)
COUCHBASE_HOST=localhost
COUCHBASE_PORT=8091
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start the System

```bash
# Start all services
docker compose up -d

# Wait for Couchbase to initialize (60 seconds)
sleep 60
```

### 4. Verify Installation

```bash
# Check if services are running
docker compose ps

# Test the API
curl http://localhost:3000
```

### 5. Submit Your First Job

```bash
# Submit a test job
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dummy-job",
    "data": {
      "message": "Hello from Jobber!"
    }
  }'
```

### 6. Monitor Job Status

```bash
# List jobs status
curl http://localhost:3000/jobs

# View jobs statistics
curl http://localhost:3000/stats
```

## 🎯 What Just Happened?

1. **Docker Compose** started three services:
   - **Web Server** (port 3000) - REST API for job management
   - **Worker** - Processes C++ jobs from the queue
   - **Couchbase** 
        - Document database for job storage
        - Hosting error as vectors, for performing the stats part that check success rate per error category (which is being dummy inserted upon startup)
   - **Redis** - Acting in multiple roles:
        - Queue, using BullMQ
        - Cache - Storing text and vector as key-value pair, for fast, local, check every time the job is failed

2. **Job Flow**:
   - Job submitted via REST API

   - Queued in Redis via BullMQ

   - Processed by Worker service
        - concurrency set to (NUMBER_OF_CPU_CORES/EXPECTED_CORES_PER_CPP_JOB)

   - Upon receiving events from the job (active/success/failed) -> projecting that into couchbase with the success response or error (also as a vector)
        - First appending that event to the events array.

            - Couchbase does it using the atomic and race-condition-proof (for the types of mutations this specific app is currently performing) "MutateIn" sub-document operation. Since there is only ArrayAppend, Increment, and Upsert, we don't need to supply a CAS and worry about optimistic locking.

                - However, there is some cost - we redundantly upsert some of the fields. It's not developer-bug proof, in case the developer accidentally change a field that should be immutable - this will be a bug.

                    - While we could implement the whole task using ottoman.js ORM, using the "immutable" identifier, ottoman itself can't help us with atomic updates, as it essentially does an optimistic CAS, which in our case, due to the short-but-frequent nature of job events, might throw an error, causing the event to get lost (with current architecture which doesn't do retries/queue/pub-sub).

                        - Mongo with mongoose would have probably been a better fit for that, using either "setOnInsert", or the "immutable" identifier.

                            - However, mongo can't run on-premise vector search, like couchbase can using Couchbase-Mobile. Yet, the architecture actually isn't designed for couchbase to be on-premise, so mongo would have probably been the better option in retrospect, as low-latency is not the main focus here. But it's been a while since i worked with Mongo, so that would have taken me longer.
                                - Had it been not a POC - I would choose mongo.

        - Then check if redis has already the vector for this error message
            - Cache hit: 
                - no need to do anything
                
            - Cache miss:

                - Call openAI to get the embeddings without spending worker machine's CPU on vectorization. Worse alternatives are:
                    - Ollama doesn't help, becuase, while it is essetially spawning a new process and communicates using I/O, as it's designed to be a real-time app, is still taking CPU cores from the local machine.

                    - Transformers are even worse idea, as they could block single thread, blocking the worker from handling jobs altogether.

                    - Spawning a new child process or worker thread, is conceptually somewhat similar in a way to ollama (especially child process), therefore a no-go as well due to the limited CPU cores we have

                - After receiving response from openAI:
                    - First upsert it to couchbase, as couchbase is the single source of truth
                        - This is crucial that Redis await the couchbase insertion, as otherwise Redis would have identified a cache-hit which is not in couchbase, therefore preventing eventual consistency for couchbase queried DB.

                    - Redis upserts this as key-value
                        - Currently Redis (and couchbase) stores the key as the plain text rather than a fast-hash, which causes some memory overhead, but is at least fast-hash-collision proof, which makes it eventually consistent. The ideal 2-subscribers-pub-sub architecture described in the end, would have solve that.
                            - A real slow-hash which is hash-collision-proof but CPU intensive isn't a good fit, as it's consuming resources from the worker, of the same reasons the openAI embedding section described above explains.

                    - This design takes into account that upon cache misses there will be redundant calls to openAI and redundant upserts to both Redis & Couchbase, but it's a trade-off wer'e willing to take, as we optimistically assume that the error messages are limited and only once in a while there will be a cache-miss. 

        - Ideally, this whole thing better be done with a Pub-Sub architecture:
            - First subsriber appends the event to couchbase, compltely decoupled from the whole vectorization section.

            - Second subscriber can do the check in redis for a cache-hit/cache-miss, and in case of cache miss, call openAI, receive the response, and produce it to another pub-sub.

            - The second pub-sub will have one which inserts it to redis, and the other to couchbase. This way we have complete eventual consistency (at the price of managing more services). This is the best solution because we vectorize for statistics, not for real-time critical application.
                - I didn't implement in such way, mainly due to time constraints, but also because it's possibly a part of a wider application, and some other calculations might come into play, and this solution is good enough for a POC, as it does achieve eventual consistency, but at the cost of very likely redundant calls to openAI, and upserts to Redis & Couchbase, upon cache-miss.

## 

## 🔧 Next Steps

- [Installation Guide](./installation.md) - Detailed setup instructions
- [API Reference](../development/api-reference.md) - Complete API documentation
- [Job Development](../development/job-development.md) - Create custom C++ jobs

## 🐛 Troubleshooting

### Common Issues

**Couchbase not ready**
```bash
# Wait longer for initialization
docker compose logs couchbase
```

**Port conflicts**
```bash
# Check what's using the ports
3000 - web-server
8091 - couchbase
6379 - redis
8001 - redisinsight (part of redis-stack)
```

**API not responding**
```bash
# Check service logs
docker compose logs webserver
docker compose logs worker
```

For more detailed troubleshooting, see [Troubleshooting Guide](../operations/troubleshooting.md). 