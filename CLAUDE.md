# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup & Installation
```bash
make setup              # Install all dependencies (backend + frontend)
make deploy-serverless  # Deploy AWS Lambda functions (first time only)
```

### Running the Application
```bash
make run               # Start all services (Postgres, Backend, Frontend)
make stop              # Stop all services
make clean-stop        # Stop and clean up (removes node_modules, volumes)
```

### Individual Services
```bash
# Backend (Port 3000)
npm run dev --prefix backend

# Frontend (Port 5174)
npm run dev --prefix frontend
```

### Database Operations
```bash
make db-shell          # Open PostgreSQL shell
make db-inspect        # Inspect database schema  
make db-reset          # Reset database (drops all data)
```

### Testing & Validation
```bash
npm test --prefix backend                    # Run backend tests
npm run e2e --prefix backend                # End-to-end tests
npm run test:mvp-frontend --prefix backend  # Frontend validation
make validate                               # Run automated validation
```

## Architecture Overview

### Tech Stack
- **Backend**: Node.js (Express) + Socket.io for real-time WebSocket communication
- **Frontend**: Svelte 5 + Vite + TailwindCSS + bits-ui components
- **Database**: PostgreSQL 16 (job history, user auth) + DynamoDB (VM/command config)
- **Cloud**: AWS Lambda + API Gateway for serverless functions
- **Container**: Docker Compose for PostgreSQL

### Project Structure
```
backend/src/
├── app.js                    # Express app configuration
├── server.js                 # HTTP server + WebSocket setup
├── config/index.js          # Environment & application config
├── database/                # Database connections (PostgreSQL + DynamoDB)
├── features/                # Feature modules (auth, commands, jobs, logs, vms)
│   ├── auth/               # User authentication & sessions
│   ├── commands/           # Command definitions & management
│   ├── jobs/               # Job execution & history
│   │   └── execution/      # Execution strategies (local, SSH, terminal)
│   ├── logs/               # Log streaming & storage
│   └── vms/                # VM configuration & management
└── shared/                 # Middleware & utilities

frontend/src/
├── App.svelte              # Main application component
├── lib/
│   ├── components/         # Reusable UI components
│   │   ├── lib/ui/        # Base UI components (shadcn-svelte style)
│   │   └── panels/        # Feature panels (execution, VM management)
│   ├── core/              # Service layer & API clients
│   ├── features/          # Feature-specific components & stores
│   └── state/             # Global state management (Svelte 5 runes)
```

### Data Flow Architecture

**Real-time Command Execution:**
1. Frontend sends `execute-command` via WebSocket
2. Backend spawns process using ExecutionManager with strategy pattern:
   - **LocalStreamStrategy**: Local command execution with streaming
   - **SshStreamStrategy**: Remote SSH command execution  
   - **TerminalSpawnStrategy**: Interactive terminal sessions
3. Output streams back through WebSocket in real-time
4. Job history persisted to PostgreSQL

**State Management:**
- Uses Svelte 5 runes (`$state`, `$derived`) for reactive state
- **Component Self-Sufficiency Pattern**: Components handle their own CRUD operations
- Global stores for VM, Command, Job, and Log management
- Authentication state managed via express-session

## Key Patterns

### Component Self-Sufficiency Standard
Components are self-contained and handle their own CRUD operations:

```javascript
// ✅ Props: Only identity data
let { vm } = $props();

// ✅ State access via derived stores  
const vmStore = $derived(getVMStore());
const selectedVMId = $derived(getSelectedVMId());

// ✅ Self-contained event handlers
function handleEdit() {
  showEditForm = true;
}

// ✅ Co-located CRUD components
import VMForm from './crud/VMForm.svelte';
let showEditForm = $state(false);
```

### Configuration Management
- Central configuration in `backend/src/config/index.js`
- Environment-based overrides for development/production/test
- AWS credentials and DynamoDB table configuration
- CORS origins, database connections, and WebSocket settings

### Database Schema
**PostgreSQL Tables:**
- `users` - User authentication (GDPR-compliant)
- `jobs` - Job execution history and caching  
- `job_logs` - Streaming log storage with timestamps

**DynamoDB Tables:**
- `vm-orchestrator-vms` - VM configurations
- `vm-orchestrator-commands` - Command definitions per VM

## Environment Setup

Required environment files:
- `.env` - Root environment variables
- `backend/.env` - Backend-specific config  
- `frontend/.env` - Frontend-specific config
- `serverless/.env` - AWS Lambda deployment config

Essential environment variables:
```bash
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin  
POSTGRES_DB=mvp-vm-orchestrator

# Authentication
SESSION_SECRET=your-secret-key

# AWS (optional, for serverless functions)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SERVERLESS_API_URL=https://your-api-gateway-url
```

## Development Workflow

1. **First-time setup**: Run `make setup` then configure environment files
2. **Daily development**: Use `make run` to start all services
3. **Database changes**: Modify `db/database.sql` and run `make db-reset`
4. **Component development**: Follow Component Self-Sufficiency Pattern
5. **Testing**: Run validation before commits with `make validate`

## Key Implementation Notes

- **WebSocket Namespaces**: Jobs use `/jobs` namespace for execution streaming
- **Validation**: Uses Valibot for request/response validation
- **Authentication**: Session-based auth with bcrypt password hashing
- **Error Handling**: Centralized error responses via `responseHelpers.js`
- **SSH Management**: Handles remote command execution with connection pooling
- **File Uploads**: Support for large payloads (10MB limit)

The application is designed as an MVP DevOps cockpit for executing commands across local and remote VMs with real-time log streaming and persistent job history.