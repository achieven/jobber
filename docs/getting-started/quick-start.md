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