# Job Development Guide

Learn how to create and deploy custom C++ jobs for the Jobber platform.

## Overview

Jobber executes C++ binaries as jobs. Each job receives input data via command-line arguments and environment variables, processes the data, and returns results via stdout/stderr and exit codes.

## Job Interface

### Input Format

Jobs receive data through:

1. **Command-line arguments**: JSON string containing job data
2. **Environment variables**: Additional context and configuration
3. **Standard input**: For large data payloads (optional)

### Output Format

Jobs communicate results through:

1. **Exit code**: 0 for success, non-zero for failure
2. **Standard output**: JSON result data
3. **Standard error**: Log messages and error details

## Creating a New Job

### 1. Basic Job Structure

```cpp
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

int main(int argc, char* argv[]) {
    try {
        // Parse input data from command line
        if (argc < 2) {
            std::cerr << "Error: No input data provided" << std::endl;
            return 1;
        }

        std::string inputJson = argv[1];
        json inputData = json::parse(inputJson);

        // Extract job parameters
        std::string message = inputData["message"];
        int timeout = inputData.value("timeout", 30000);

        // Process the job
        std::cout << "Processing job with message: " << message << std::endl;
        
        // Simulate work
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));

        // Prepare result
        json result = {
            {"output", "Job completed successfully"},
            {"message", message},
            {"executionTime", 1000},
            {"processedAt", "2024-01-01T00:00:00.000Z"}
        };

        // Output result as JSON
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
```

### 2. Job Template

Use this template for new jobs:

```cpp
#include <iostream>
#include <string>
#include <chrono>
#include <thread>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class JobProcessor {
private:
    json inputData;
    std::chrono::steady_clock::time_point startTime;

public:
    JobProcessor(const json& data) : inputData(data) {
        startTime = std::chrono::steady_clock::now();
    }

    json process() {
        // TODO: Implement your job logic here
        
        // Example: Process input data
        std::string message = inputData["message"];
        
        // Simulate processing
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
        
        // Calculate execution time
        auto endTime = std::chrono::steady_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
        
        // Return result
        return {
            {"status", "completed"},
            {"message", message},
            {"executionTime", duration.count()},
            {"result", "Your job result here"}
        };
    }
};

int main(int argc, char* argv[]) {
    try {
        // Validate arguments
        if (argc < 2) {
            std::cerr << "Error: No input data provided" << std::endl;
            return 1;
        }

        // Parse input JSON
        std::string inputJson = argv[1];
        json inputData = json::parse(inputJson);

        // Process job
        JobProcessor processor(inputData);
        json result = processor.process();

        // Output result
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const json::parse_error& e) {
        std::cerr << "JSON parse error: " << e.what() << std::endl;
        return 1;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
```

## Building Jobs

### 1. Local Development

```bash
# Compile with debug symbols
g++ -g -std=c++17 -O0 job.cpp -o job

# Compile for production
g++ -std=c++17 -O2 job.cpp -o job
```

### 2. Docker Build

Create a `Dockerfile.job` for your job:

```dockerfile
FROM gcc:11 as builder

WORKDIR /app
COPY job.cpp .
RUN g++ -std=c++17 -O2 job.cpp -o job

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/job /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/job"]
```

### 3. Integration with Jobber

Add your job to the build process:

```bash
# Add to package.json scripts
"buildJobs": "mkdir -p dist/worker/jobs && g++ -static src/worker/jobs/*.cpp -o dist/worker/jobs/job-name"
```

## Job Best Practices

### 1. Error Handling

```cpp
// Always handle exceptions
try {
    // Your job logic
} catch (const std::exception& e) {
    std::cerr << "Job failed: " << e.what() << std::endl;
    return 1;
}

// Validate input data
if (!inputData.contains("required_field")) {
    std::cerr << "Missing required field: required_field" << std::endl;
    return 1;
}
```

### 2. Progress Reporting

```cpp
// Report progress to stderr (will be logged)
std::cerr << "Processing step 1/3..." << std::endl;
// ... process step 1

std::cerr << "Processing step 2/3..." << std::endl;
// ... process step 2

std::cerr << "Processing step 3/3..." << std::endl;
// ... process step 3
```

### 3. Resource Management

```cpp
// Set reasonable timeouts
auto startTime = std::chrono::steady_clock::now();
const auto timeout = std::chrono::seconds(300); // 5 minutes

while (processing) {
    if (std::chrono::steady_clock::now() - startTime > timeout) {
        std::cerr << "Job timeout exceeded" << std::endl;
        return 1;
    }
    // ... continue processing
}
```

### 4. Memory Management

```cpp
// Use RAII for resource management
class FileHandler {
private:
    std::ifstream file;
public:
    FileHandler(const std::string& filename) : file(filename) {}
    ~FileHandler() { if (file.is_open()) file.close(); }
    // ... file operations
};
```

## Testing Jobs

### 1. Unit Testing

```cpp
#include <gtest/gtest.h>

TEST(JobTest, BasicProcessing) {
    json inputData = {{"message", "test"}};
    JobProcessor processor(inputData);
    json result = processor.process();
    
    EXPECT_EQ(result["status"], "completed");
    EXPECT_EQ(result["message"], "test");
}
```

### 2. Integration Testing

```bash
# Test job with sample data
echo '{"message": "test", "timeout": 1000}' | ./job

# Test error handling
echo 'invalid json' | ./job
```

### 3. Performance Testing

```bash
# Measure execution time
time echo '{"message": "test"}' | ./job

# Test with large data
echo '{"data": "'$(head -c 1M /dev/zero | tr '\0' 'A')'"}' | ./job
```

## Deployment

### 1. Add to Worker

Place your compiled job in `dist/worker/jobs/`:

```bash
cp job dist/worker/jobs/my-job
chmod +x dist/worker/jobs/my-job
```

### 2. Update Docker Build

Add to `Dockerfile.worker`:

```dockerfile
COPY dist/worker/jobs/ /app/jobs/
RUN chmod +x /app/jobs/*
```

### 3. Submit Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-job",
    "data": {
      "message": "Hello from my custom job!"
    }
  }'
```

## Environment Variables

Jobs have access to these environment variables:

| Variable | Description |
|----------|-------------|
| `JOB_ID` | Unique job identifier |
| `JOB_NAME` | Name of the job executable |
| `JOB_ATTEMPT` | Current attempt number |
| `WORKER_ID` | Worker instance identifier |
| `NODE_ENV` | Environment (development/production) |

## Monitoring and Debugging

### 1. Logging

```cpp
// Use stderr for logs (captured by worker)
std::cerr << "[" << getenv("JOB_ID") << "] Starting job" << std::endl;
std::cerr << "[" << getenv("JOB_ID") << "] Processing data..." << std::endl;
std::cerr << "[" << getenv("JOB_ID") << "] Job completed" << std::endl;
```

### 2. Debug Mode

```cpp
bool isDebug = std::string(getenv("NODE_ENV")) == "development";
if (isDebug) {
    std::cerr << "Debug: Input data: " << inputData.dump(2) << std::endl;
}
```

### 3. Performance Monitoring

```cpp
auto startTime = std::chrono::steady_clock::now();
// ... job processing
auto endTime = std::chrono::steady_clock::now();
auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);

std::cerr << "Job completed in " << duration.count() << "ms" << std::endl;
```

## Example Jobs

### 1. Data Processing Job

```cpp
#include <iostream>
#include <fstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

int main(int argc, char* argv[]) {
    try {
        json inputData = json::parse(argv[1]);
        std::string inputFile = inputData["inputFile"];
        
        // Process file
        std::ifstream file(inputFile);
        std::string content((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
        
        // Transform data
        std::transform(content.begin(), content.end(), content.begin(), ::toupper);
        
        // Save result
        std::ofstream outputFile(inputFile + ".processed");
        outputFile << content;
        
        json result = {
            {"status", "completed"},
            {"inputFile", inputFile},
            {"outputFile", inputFile + ".processed"},
            {"charactersProcessed", content.length()}
        };
        
        std::cout << result.dump() << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
```

### 2. API Integration Job

```cpp
#include <iostream>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

int main(int argc, char* argv[]) {
    try {
        json inputData = json::parse(argv[1]);
        std::string url = inputData["url"];
        
        CURL* curl = curl_easy_init();
        std::string response;
        
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        
        CURLcode res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);
        
        if (res != CURLE_OK) {
            throw std::runtime_error("HTTP request failed");
        }
        
        json result = {
            {"status", "completed"},
            {"url", url},
            {"responseLength", response.length()},
            {"response", response.substr(0, 100) + "..."}
        };
        
        std::cout << result.dump() << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}
```

---

*For more information about the API, see [API Reference](./api-reference.md).* 