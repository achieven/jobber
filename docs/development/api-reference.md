# API Reference

Complete REST API documentation for the Jobber platform.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. Future versions will support API key authentication.

## Common Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Health Check

#### GET /health

Check if the service is running.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Jobs

#### POST /jobs

Submit a new job for processing.

**Request Body:**
```json
{
  "name": "dummy-job",
  "data": {
    "message": "Hello from Jobber!",
    "parameters": {
      "timeout": 30000,
      "priority": "high"
    }
  },
  "options": {
    "attempts": 3,
    "delay": 0,
    "priority": 1
  }
}
```

**Parameters:**
- `name` (string, required): Name of the C++ job executable
- `data` (object, required): Job-specific data to pass to the executable
- `options` (object, optional): BullMQ job options
  - `attempts` (number): Number of retry attempts (default: 3)
  - `delay` (number): Delay before processing in milliseconds (default: 0)
  - `priority` (number): Job priority (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123456789",
    "name": "dummy-job",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "queuePosition": 1
  }
}
```

#### GET /jobs

List all jobs with optional filtering.

**Query Parameters:**
- `status` (string, optional): Filter by job status (PENDING, ACTIVE, COMPLETED, FAILED)
- `limit` (number, optional): Number of jobs to return (default: 50, max: 100)
- `offset` (number, optional): Number of jobs to skip (default: 0)
- `name` (string, optional): Filter by job name

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "jobId": "job_123456789",
        "name": "dummy-job",
        "status": "COMPLETED",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "completedAt": "2024-01-01T00:01:00.000Z",
        "result": {
          "output": "Job completed successfully",
          "executionTime": 5000
        }
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /jobs/{jobId}

Get detailed information about a specific job.

**Path Parameters:**
- `jobId` (string, required): The job identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123456789",
    "name": "dummy-job",
    "status": "COMPLETED",
    "data": {
      "message": "Hello from Jobber!"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "startedAt": "2024-01-01T00:00:30.000Z",
    "completedAt": "2024-01-01T00:01:00.000Z",
    "attempts": 1,
    "result": {
      "output": "Job completed successfully",
      "executionTime": 5000,
      "exitCode": 0
    },
    "progress": 100
  }
}
```

#### DELETE /jobs/{jobId}

Cancel a pending or active job.

**Path Parameters:**
- `jobId` (string, required): The job identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123456789",
    "status": "CANCELLED",
    "cancelledAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Statistics

#### GET /stats

Get system statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": {
      "total": 100,
      "pending": 5,
      "active": 2,
      "completed": 85,
      "failed": 8
    },
    "queue": {
      "waiting": 5,
      "active": 2,
      "completed": 85,
      "failed": 8,
      "delayed": 0
    },
    "performance": {
      "averageProcessingTime": 5000,
      "jobsPerMinute": 12,
      "successRate": 0.92
    },
    "system": {
      "uptime": 3600,
      "memoryUsage": "256MB",
      "cpuUsage": "15%"
    }
  }
}
```

#### GET /stats/jobs

Get detailed job statistics.

**Query Parameters:**
- `period` (string, optional): Time period for statistics (1h, 24h, 7d, 30d, all)
- `name` (string, optional): Filter by job name

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "jobTypes": [
      {
        "name": "dummy-job",
        "count": 50,
        "successRate": 0.96,
        "averageTime": 4500,
        "totalTime": 225000
      }
    ],
    "timeline": [
      {
        "hour": "2024-01-01T00:00:00.000Z",
        "submitted": 10,
        "completed": 8,
        "failed": 2
      }
    ]
  }
}
```

## Job Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Job is queued and waiting to be processed |
| `ACTIVE` | Job is currently being processed |
| `COMPLETED` | Job completed successfully |
| `FAILED` | Job failed after all retry attempts |
| `CANCELLED` | Job was cancelled by user |
| `DELAYED` | Job is scheduled for future execution |

## Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 404 | `JOB_NOT_FOUND` | Job with specified ID not found |
| 409 | `JOB_ALREADY_COMPLETED` | Cannot cancel completed job |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 500 | `INTERNAL_ERROR` | Internal server error |

## Rate Limiting

Currently, no rate limiting is implemented. Future versions will include rate limiting based on API keys.

## Examples

### Submit a Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dummy-job",
    "data": {
      "message": "Process this data",
      "inputFile": "/path/to/input.txt"
    },
    "options": {
      "attempts": 5,
      "priority": 2
    }
  }'
```

### Monitor Job Progress

```bash
# Submit job
JOB_ID=$(curl -s -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"name": "dummy-job", "data": {"message": "test"}}' | jq -r '.data.jobId')

# Check status
curl -s http://localhost:3000/jobs/$JOB_ID | jq '.data.status'
```

### Get System Statistics

```bash
curl -s http://localhost:3000/stats | jq '.data.jobs'
```

---

*For more information about job development, see [Job Development](./job-development.md).* 