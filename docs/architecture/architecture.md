# Architecture and Flow Overview

## Current Architecture

### Job Processing Flow
1. **Job Submission**: Jobs submitted via REST API
2. **Queueing**: Jobs queued in Redis via BullMQ
3. **Processing**: Worker service processes jobs with concurrency set to `(NUMBER_OF_CPU_CORES/EXPECTED_CORES_PER_CPP_JOB)`

### Event Handling & Data Persistence
Upon receiving job events (active/success/failed), the system projects data into Couchbase, with 2 types of data:

**1. Event Storage**:
- Events appended to arrays using Couchbase's atomic `MutateIn` sub-document operations
- Uses only ArrayAppend, Increment, and Upsert operations, therefore race-condition-proof (no CAS required)
- **Trade-off**: Some fields are redundantly upserted; not developer-bug proof for immutable fields (i.e job name/id/data) 
- While ottoman.js could have supplied immutability with the `immutable` identifier, it lacks the atomic and race-condition-proof functionality that MutateIn offers. The same is also true the other way around - MutateIn using the SDK can't provide immutability.

**Database Choice Constraints**:
- **Couchbase chosen over MongoDB** despite MongoDB being potentially better suited, as it can handle immutability (or rather, setOnInsert though it's less advised) and be race-condition-proof at the same time.
- **Reasoning**: 
    - Couchbase supports on-premise vector search via Couchbase-Mobile
    - Couchbase designed for low latency
- **Reality**: Current suggested architecture isn't really designed use on-premise deployment, making MongoDB a better retrospective choice
- **Time constraint**: Personal familiarity with Couchbase vs. learning curve for MongoDB

**2. Vector insertion**:
1. Check Redis cache for existing error message vectors
2. **Cache Hit**: No action needed
3. **Cache Miss**: 
   - Call OpenAI API for embeddings (avoiding local CPU usage)
   - Upsert to Couchbase first (single source of truth)
   - Then upsert to Redis cache

**Vectorization Constraints**:
- **OpenAI chosen over local alternatives**:
  - Ollama rejected: Still consumes local CPU cores
  - Transformers rejected:  Very likely to block the main event loop thread
  - Child processes rejected: Limited CPU cores available, effetively similar consideration as ollama
- **DB Memory overhead vs. Resource utilization trade-off**: 
    - Plain text keys instead of slow-hashes which take expensive CPU cores
    - Fast-hashes will cause fast-hash collisions, allowing false-positive cache-hits, causing data inconsistency
- **Redundancy accepted**: Cache misses may cause redundant OpenAI calls and database upserts

### Statistics & Analytics
**Job Statistics**:
- Groups jobs by name with counters for active/failed/completed states
- Provides all job Ids, for general understanding (can be clickable to get data for each job)
- Tracks aurrently active jobs for live monitoring
- Provides latest job invocation data


**Performance Analytics**:
- Success rate analysis by retry attempts
    - Motivation: Predicting, if a job has failed a given number of times, what are it's chances to eventually succeed
- Concurrent job failure analysis (with known limitations)
    - Motivation: Try to see patterns of 
- Vector search by error categories
    - Motivation: Team has a list of error categories(e.g Timeout/Image processing error/Memory exceeded/Spawning child process failed etc..), it wants to know if how often do we encounter such error

**Known Limitations (given time constraint and task being essentialy a POC)**:
- Retries analytics:
    - Current index not covering the fetched fields, therefore performing another fetch (within couchbase) to retrieve the data.
        - This is very practical to overcome, just didn't get to it (at the time of writing this documentation)
- Concurrency detection:
    - "Concurrent" is only at the top level (doesn't account for delays).
    - Detection is binary - doesn't provide success rate by number of concurrent invocations, only whether there is *any* job running concurrently
    - Doesn't compare to non-concurrent jobs success rate, making it not useful enough to the user
- Vector seach:
    - Performing a separate DB query for each error category instead of single query - not scaleable
    - Using a dummy 0.4 similarity threshold, for local testing only
    - Using general-purpose embedding model rather than programming-specific one

## Optimal Architecture

### Pub-Sub Event-Driven Design
**Decoupled Event Processing**:
1. **Event Subscriber**: Handles job event persistence to Couchbase (completely decoupled from vectorization)
2. **Vectorization Subscriber**: 
   - Performs a slow hash (e.g SHA-256) on the string
   - Checks Redis cache for error vectors
   - On cache miss: calls OpenAI and publishes to vectorization pub-sub
3. **Data Persistence Subscribers**: 
   - Separate subscribers for Redis and Couchbase vector storage
   - Ensures eventual consistency without redundant operations
   - Ensures low memory overhead for storing hashes instead of strings as keys, without hash collisions

**Benefits**:
- Complete eventual consistency, without redundant OpenAI API calls, nor redundant upserts


**Trade-offs**:
- Increased complexity (more services to manage) - especially within the time constraints
### Database Optimization
**MongoDB Alternative**:
- Couchbase's optimistic CAS nature isn't suitable for frequent (even if short-ranged) updates
- Mongo could use it's pessimistic nature to apply immutability while being race-condition-proof
- More mature ORM support for complex operations
**Hashing Strategy**:
- Implement slow-hash for memory efficiency, on a separate services than the worker to avoid using it's limited CPUs
- Store original text as a document field for queries
- Maintain hash-collision-proof consistency

## Bottom line - Implementation Constraints

**Current POC**:

**Data integrity**:
- Balances complexity vs. functionality for proof-of-concept scope
- Provides sufficient consistency for demonstration purposes
- Architecture suitable for integration into larger systems, within the limitations described below

**Limitations**:

- Time constraints preventing full pub-sub implementation
- Excluding immutability for specific fields (job name/id/data)
- Stats are at the POC level - proving nice data for each category, but have some limitations regarding the quality of the data and some are not fully performance optimized
- Redundant calls to OpenAI and Redis/Couchbase upserts
- Memory overhead for storing keys as string

