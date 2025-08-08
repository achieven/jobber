# Deployment Guide

Complete guide for deploying Jobber to production environments.

## Prerequisites

- Docker and Docker Compose (or Kubernetes)
- Couchbase Server 7.0+
- Redis 6.0+
- Node.js 18+ (for building)
- OPENAI_API_KEY with embeddings capability

## Production Architecture

### Recommended Setup

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Worker Pool   │
│   (Nginx/HAProxy│◄──►│   (2+ instances)│◄──►│   (3+ instances)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Couchbase     │    │   Redis Cluster │
                       │   Cluster       │    │   (3+ nodes)    │
                       └─────────────────┘    └─────────────────┘
```

## Environment Configuration

### 1. Environment Variables

Create a production `.env` file:

```bash
# Required
OPENAI_API_KEY=your_production_openai_key

# Database Configuration
COUCHBASE_HOST=couchbase.your-domain.com
COUCHBASE_PORT=8091
COUCHBASE_USERNAME=jobber_user
COUCHBASE_PASSWORD=secure_password_here
COUCHBASE_TIMEOUT=30000

# Redis Configuration
REDIS_HOST=redis.your-domain.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
REDIS_TLS=true

# Application Configuration
NODE_ENV=production
PORT=3000
WORKER_CONCURRENCY=5
JOB_TIMEOUT=300000

# Security
JWT_SECRET=your_jwt_secret_here
API_KEY_SECRET=your_api_key_secret

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

### 2. Couchbase Setup

#### Create Production Bucket

```sql
-- Connect to Couchbase Admin UI or use cbq
CREATE BUCKET jobber_bucket 
WITH {
  "ramQuotaMB": 1024,
  "replicaNumber": 2,
  "replicaIndex": true,
  "conflictResolutionType": "seqno",
  "maxTTL": 0,
  "compressionMode": "passive",
  "evictionPolicy": "valueOnly"
};

-- Create indexes
CREATE PRIMARY INDEX ON `jobber_bucket`;
CREATE INDEX idx_job_status ON `jobber_bucket`(status);
CREATE INDEX idx_job_created ON `jobber_bucket`(createdAt);
```

#### Create Application User

```sql
-- Create user with limited permissions
INSERT INTO system:users VALUES ("jobber_user", {
  "name": "Jobber Application User",
  "password": "secure_password_here",
  "roles": [
    "data_reader[jobber_bucket]",
    "data_writer[jobber_bucket]",
    "query_system_catalog"
  ]
});
```

### 3. Redis Setup

#### Redis Cluster Configuration

```bash
# redis.conf for each node
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
requirepass secure_redis_password
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

## Docker Deployment

### 1. Production Docker Compose

```yaml
version: '3.8'

services:
  web-server:
    build:
      context: .
      dockerfile: Dockerfile.webServer
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - COUCHBASE_HOST=${COUCHBASE_HOST}
      - COUCHBASE_USERNAME=${COUCHBASE_USERNAME}
      - COUCHBASE_PASSWORD=${COUCHBASE_PASSWORD}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - couchbase
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - NODE_ENV=production
      - COUCHBASE_HOST=${COUCHBASE_HOST}
      - COUCHBASE_USERNAME=${COUCHBASE_USERNAME}
      - COUCHBASE_PASSWORD=${COUCHBASE_PASSWORD}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - WORKER_CONCURRENCY=${WORKER_CONCURRENCY}
    depends_on:
      - couchbase
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  couchbase:
    image: couchbase:7.2
    ports:
      - "8091-8096:8091-8096"
      - "11210:11210"
    environment:
      - COUCHBASE_ADMINISTRATOR_USERNAME=Administrator
      - COUCHBASE_ADMINISTRATOR_PASSWORD=secure_admin_password
    volumes:
      - couchbase_data:/opt/couchbase/var
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web-server
    restart: unless-stopped

volumes:
  couchbase_data:
  redis_data:
```

### 2. Nginx Configuration

```nginx
upstream jobber_backend {
    server web-server:3000;
    server web-server:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    client_max_body_size 10M;

    location / {
        proxy_pass http://jobber_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        proxy_pass http://jobber_backend;
    }
}
```

## Kubernetes Deployment

### 1. Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jobber
```

### 2. ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jobber-config
  namespace: jobber
data:
  NODE_ENV: "production"
  COUCHBASE_HOST: "couchbase-service"
  REDIS_HOST: "redis-service"
  WORKER_CONCURRENCY: "5"
  JOB_TIMEOUT: "300000"
```

### 3. Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jobber-secrets
  namespace: jobber
type: Opaque
data:
  OPENAI_API_KEY: <base64-encoded-key>
  COUCHBASE_PASSWORD: <base64-encoded-password>
  REDIS_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
```

### 4. Web Server Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
  namespace: jobber
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-server
  template:
    metadata:
      labels:
        app: web-server
    spec:
      containers:
      - name: web-server
        image: jobber/web-server:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: jobber-config
        - secretRef:
            name: jobber-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web-server-service
  namespace: jobber
spec:
  selector:
    app: web-server
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### 5. Worker Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: jobber
spec:
  replicas: 5
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
      - name: worker
        image: jobber/worker:latest
        envFrom:
        - configMapRef:
            name: jobber-config
        - secretRef:
            name: jobber-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: jobs-volume
          mountPath: /app/jobs
      volumes:
      - name: jobs-volume
        emptyDir: {}
```

## Monitoring and Observability

### 1. Health Checks

```bash
# Check service health
curl -f https://your-domain.com/health

# Check job processing
curl https://your-domain.com/stats
```

### 2. Logging

```bash
# View logs
docker compose logs -f web-server
docker compose logs -f worker

# In Kubernetes
kubectl logs -f deployment/web-server -n jobber
kubectl logs -f deployment/worker -n jobber
```

### 3. Metrics

Enable Prometheus metrics:

```typescript
// Add to your NestJS app
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
  ],
})
export class AppModule {}
```

### 4. Alerting

Set up alerts for:
- High job failure rates
- Queue depth exceeding thresholds
- Service unavailability
- High resource usage

## Security Considerations

### 1. Network Security

- Use HTTPS/TLS for all external communication
- Implement API rate limiting
- Use VPC/firewall rules to restrict access
- Enable CORS with specific origins

### 2. Authentication

```typescript
// Implement API key authentication
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    return this.validateApiKey(apiKey);
  }
}
```

### 3. Data Protection

- Encrypt sensitive data at rest
- Use secure communication channels
- Implement audit logging
- Regular security updates

## Backup and Recovery

### 1. Couchbase Backup

```bash
# Create backup
cbbackup http://couchbase:8091 /backup \
  -u Administrator -p password \
  -b jobber_bucket

# Restore backup
cbrestore /backup http://couchbase:8091 \
  -u Administrator -p password \
  -b jobber_bucket
```

### 2. Redis Backup

```bash
# Enable AOF persistence
redis-cli CONFIG SET appendonly yes

# Manual backup
redis-cli BGSAVE
```

## Scaling

### 1. Horizontal Scaling

```bash
# Scale web servers
docker compose up -d --scale web-server=5

# Scale workers
docker compose up -d --scale worker=10

# In Kubernetes
kubectl scale deployment web-server --replicas=5 -n jobber
kubectl scale deployment worker --replicas=10 -n jobber
```

### 2. Auto-scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
  namespace: jobber
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Troubleshooting

### Common Issues

1. **Couchbase Connection Issues**
   ```bash
   # Check connectivity
   curl -u Administrator:password http://couchbase:8091/pools
   
   # Check bucket status
   curl -u Administrator:password http://couchbase:8091/pools/default/buckets
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   redis-cli -h redis -p 6379 -a password ping
   ```

3. **Job Processing Issues**
   ```bash
   # Check worker logs
   docker compose logs worker | grep ERROR
   
   # Check job status
   curl https://your-domain.com/jobs/{job-id}
   ```

---

*For more information about monitoring, see [Monitoring](./monitoring.md).* 