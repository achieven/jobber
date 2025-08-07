# System Overview

Jobber is a distributed job processing platform designed to execute C++ jobs with robust queue management, monitoring, and persistence capabilities.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   REST API      │    │   Job Queue     │
│                 │◄──►│   (Web Server)  │◄──►│   (BullMQ)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Couchbase     │    │   Worker        │
                       │   (Database)    │    │   (Job Executor)│
                       └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   C++ Jobs      │
                                              │   (Executables) │
                                              └─────────────────┘
```

## 🧩 Core Components

### 1. Web Server (NestJS)
- **Purpose**: REST API for job management and monitoring
- **Port**: 3000
- **Key Features**:
  - Job submission and status tracking
  - Statistics and monitoring endpoints
  - Health checks and system status
  - Queue management

### 2. Worker Service (NestJS)
- **Purpose**: Job execution engine
- **Key Features**:
  - Processes jobs from BullMQ queue
  - Executes C++ binaries
  - Handles job lifecycle events
  - Error handling and retry logic

### 3. Couchbase Database
- **Purpose**: Persistent job storage and metadata
- **Key Features**:
  - Job history and results
  - System statistics
  - Error logs and debugging info
  - Scalable document storage

### 4. Redis (BullMQ Backend)
- **Purpose**: Queue management and job scheduling
- **Key Features**:
  - Reliable job queuing
  - Job prioritization
  - Retry mechanisms
  - Progress tracking

### 5. C++ Job Executables
- **Purpose**: Actual job processing logic
- **Key Features**:
  - Custom business logic
  - Resource-intensive computations
  - Integration with external services
  - Standardized input/output format

## 🔄 Data Flow

### Job Submission Flow
1. **Client** submits job via REST API
2. **Web Server** validates and stores job in Couchbase
3. **Web Server** adds job to BullMQ queue
4. **Worker** picks up job from queue
5. **Worker** executes C++ binary with job data
6. **Worker** stores results back to Couchbase
7. **Client** can query job status and results

### Job Lifecycle States
```
PENDING → ACTIVE → COMPLETED/FAILED
    ↓
RETRY (if failed)
```

## 🎯 Design Principles

### 1. Separation of Concerns
- **Web Server**: API and job management
- **Worker**: Job execution and processing
- **Database**: Persistence and state management
- **Queue**: Reliable job delivery

### 2. Fault Tolerance
- Automatic retry mechanisms
- Graceful error handling
- Job state persistence
- Service health monitoring

### 3. Scalability
- Stateless worker design
- Horizontal scaling capability
- Queue-based load distribution
- Database connection pooling

### 4. Observability
- Comprehensive logging
- Job progress tracking
- Performance metrics
- Error reporting and debugging

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Framework** | NestJS | REST API and service orchestration |
| **Queue System** | BullMQ | Reliable job queuing and processing |
| **Database** | Couchbase | Document storage and job persistence |
| **Cache/Queue** | Redis | BullMQ backend and caching |
| **Job Runtime** | C++ | High-performance job execution |
| **Containerization** | Docker | Service isolation and deployment |
| **Orchestration** | Docker Compose | Local development and testing |

## 🚀 Deployment Architecture

### Development Environment
- Single-node deployment
- Docker Compose for service orchestration
- Local file system for C++ binaries

### Production Considerations
- Multi-node worker scaling
- Load balancer for web server
- Persistent storage for Couchbase
- Redis cluster for high availability
- Container orchestration (Kubernetes)

## 📊 Monitoring and Observability

### Metrics Collected
- Job success/failure rates
- Processing times and throughput
- Queue depths and wait times
- System resource utilization
- Error rates and types

### Logging Strategy
- Structured logging with correlation IDs
- Job-level traceability
- Service health monitoring
- Error context preservation

## 🔒 Security Considerations

### Authentication & Authorization
- API key management (future enhancement)
- Service-to-service communication security
- Database access controls

### Data Protection
- Sensitive data encryption
- Secure job data handling
- Audit logging for compliance

---

*For detailed implementation information, see [Microservices](./microservices.md) and [Data Flow](./data-flow.md).* 