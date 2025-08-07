

## Description

A project for launching c++ jobs from a node.js nestjs application, and tracking jobs stats.

## Prerequisites

docker
OPENAI_API_KEY that can use the embeddings capability

## Deployment

```bash
$ docker compose up
wait 60 seconds for couchbase to come up
```

## TODO achi:
### 1. organise structure to be with shared directory, but without unneeded code for worker & webServer
### 2. add real validation
### 3. use job id and jobName precisely when nedded