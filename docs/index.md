# Jobber Documentation

Welcome to the Jobber documentation! This comprehensive guide will help you understand, develop, and deploy the Jobber distributed job processing platform.

## 🎯 What is Jobber?

Jobber is a distributed job processing platform designed to execute C++ jobs with robust queue management, monitoring, and persistence capabilities. It's built with NestJS, Couchbase, Redis, and BullMQ.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[Quick Start Guide](./getting-started/quick-start.md)** - Get up and running in under 5 minutes
- **[Installation Guide](./getting-started/installation.md)** - Detailed setup instructions
- **[Configuration](./getting-started/configuration.md)** - Environment variables and settings

### 🏗️ Architecture
- **[System Overview](./architecture/system-overview.md)** - High-level architecture and components
- **[Microservices](./architecture/microservices.md)** - Web Server and Worker services
- **[Data Flow](./architecture/data-flow.md)** - How data moves through the system
- **[Queue System](./architecture/queue-system.md)** - BullMQ integration and job processing

### 💻 Development
- **[Development Setup](./development/setup.md)** - Local development environment
- **[API Reference](./development/api-reference.md)** - Complete REST API documentation
- **[Job Development](./development/job-development.md)** - Creating and deploying C++ jobs
- **[Testing](./development/testing.md)** - Testing strategies and examples

### 🚀 Operations
- **[Deployment](./operations/deployment.md)** - Production deployment guide
- **[Monitoring](./operations/monitoring.md)** - System monitoring and logging
- **[Troubleshooting](./operations/troubleshooting.md)** - Common issues and solutions
- **[Performance](./operations/performance.md)** - Performance optimization

### 📖 Reference
- **[Models](./reference/models.md)** - Data models and schemas
- **[Services](./reference/services.md)** - Service documentation
- **[Database](./reference/database.md)** - Couchbase setup and usage
- **[CLI Commands](./reference/cli.md)** - Available npm scripts and commands

## 🎯 Quick Navigation

### I'm New Here
1. Start with the **[Quick Start Guide](./getting-started/quick-start.md)**
2. Read the **[System Overview](./architecture/system-overview.md)**
3. Try the **[API Reference](./development/api-reference.md)**

### I Want to Develop
1. Set up your **[Development Environment](./development/setup.md)**
2. Learn about **[Job Development](./development/job-development.md)**
3. Check the **[Testing Guide](./development/testing.md)**

### I Want to Deploy
1. Review the **[Deployment Guide](./operations/deployment.md)**
2. Set up **[Monitoring](./operations/monitoring.md)**
3. Know about **[Troubleshooting](./operations/troubleshooting.md)**

## 🔧 Key Concepts

### Job Lifecycle
```
PENDING → ACTIVE → COMPLETED/FAILED
    ↓
RETRY (if failed)
```

### Architecture Components
- **Web Server**: REST API for job management
- **Worker**: Job execution engine
- **Couchbase**: Document database
- **Redis**: Queue backend
- **C++ Jobs**: Custom executable logic

### Technology Stack
- **Backend**: NestJS, TypeScript
- **Database**: Couchbase
- **Queue**: BullMQ + Redis
- **Jobs**: C++
- **Containerization**: Docker
- **Orchestration**: Docker Compose/Kubernetes

## 📖 Examples

### Submit a Job
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "dummy-job",
    "data": {
      "message": "Hello from Jobber!"
    }
  }'
```

### Check Job Status
```bash
curl http://localhost:3000/jobs/{job-id}
```

### View Statistics
```bash
curl http://localhost:3000/stats
```

## 🔗 External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Couchbase Documentation](https://docs.couchbase.com/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

To contribute to this documentation:

1. Follow the existing structure and format
2. Use clear, concise language
3. Include code examples where appropriate
4. Update the table of contents when adding new pages
5. Test all code examples before committing

## 📝 Documentation Standards

This documentation follows these standards:

- **Clear Structure**: Logical organization with consistent navigation
- **Code Examples**: Practical, tested code snippets
- **Visual Aids**: Diagrams and flowcharts where helpful
- **Progressive Disclosure**: Start simple, add complexity gradually
- **Cross-References**: Link related topics together

---

*Last updated: $(date)*

*For questions or issues, please refer to the [Troubleshooting Guide](./operations/troubleshooting.md) or create an issue in the repository.* 