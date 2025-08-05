# VM Orchestrator – MVP

**tl;dr** A minimal DevOps cockpit that lets you execute make targets and tail logs across local and remote VMs with real-time streaming and audit trail.

## Features
- Real-time log streaming over WebSocket
- Terminal spawn for interactive targets (`make vm create`, `make ssh`, …)
- Process streaming for non-interactive targets (`make status`, `make build`, …)
- Remote log streaming via SSH (`docker logs -f`)
- Persistent job history stored in Postgres
- **security**: User persistence in Postgres allows GDPR compliance
- **NEW**: VM configuration management with DynamoDB
- **NEW**: Command management per VM with serverless API
- **NEW**: Job and Logs caching with in Postgresql for improved performance

## Tech stack
- Frontend: Svelte + Vite + Socket.io-client
- Backend: Node.js (Express) + Socket.io
- Database: Postgres 16 (job history) + DynamoDB (VM/command config)
- Cloud: AWS Lambda + API Gateway (serverless functions)
- Container orchestration: Docker Compose

## Quick start

```bash
git clone https://github.com/your-org/vm-orchestrator.git
cd vm-orchestrator
make setup      # build containers, install deps, initialise DB
make dev        # start backend, frontend & postgres
```

Application endpoints  
- Frontend http://localhost:5174  
- Backend  http://localhost:3000  

Stop everything:

```bash
make stop
```

Reset workspace:

```bash
make clean
```

Run automated validation:

```bash
make validate
```

## Serverless Setup 

For enhanced VM and command management, deploy the serverless functions:

```bash
# Configure AWS credentials
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key

# Deploy serverless functions
./scripts/deploy-serverless.sh

# Update .env with the deployed API Gateway URL
echo "SERVERLESS_API_URL=https://your-api-id.execute-api.region.amazonaws.com" >> .env
```

The serverless functions provide:
- VM configuration CRUD operations
- Command management per VM
- Job caching for improved performance

See `serverless/README.md` for detailed API documentation.

## Project layout
```
backend      src/server.js
frontend     frontend/src/*
db           db/database.sql
serverless   serverless functions for VM/command management
docs         Product & architecture documents
scripts      Deployment and utility scripts
```

## How it works
1. The frontend opens a WebSocket to the backend.
2. When you press a command button the browser emits `execute-command`.
3. The backend spawns a local process or SSH command, streams stdout/stderr back through the socket and persists every chunk to Postgres.
4. When the process exits the backend updates the job status and broadcasts `job-finished`.
5. On page load the frontend fetches the last 10 jobs from `/api/jobs` for history replay.

## MVP scope
This repository intentionally ships only the core pipeline needed for the exam:
- single-node Docker Compose stack
- hard-coded demo commands in `src/server.js`
- basic Svelte UI with three example buttons

Everything else (mkcli registry, VM-config parser, full execution manager) lives in `docs/PRD.md` and will be implemented after the MVP milestone.

Happy hacking! ☕
