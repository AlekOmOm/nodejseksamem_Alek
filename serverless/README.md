# VM Orchestrator Serverless API

This directory contains the serverless functions for managing VMs and commands using AWS Lambda and DynamoDB.

## Setup

1. **Install dependencies:**
   ```bash
   cd serverless
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.sample .env
   # Edit .env with your AWS credentials and settings
   ```

3. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

## API Endpoints

### VMs Management

- `GET /api/vms` - List all VMs
- `POST /api/vms` - Create a new VM
- `GET /api/vms/{id}` - Get specific VM
- `PUT /api/vms/{id}` - Update VM
- `DELETE /api/vms/{id}` - Delete VM

#### VM Object Structure
```json
{
  "id": "uuid",
  "name": "my-vm",
  "host": "192.168.1.100",
  "user": "ubuntu",
  "environment": "development",
  "port": 22,
  "description": "Development VM",
  "sshConfig": {
    "identityFile": "/path/to/key.pem",
    "strictHostKeyChecking": false
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Commands Management

- `GET /api/vms/{vmId}/commands` - List commands for a VM
- `POST /api/vms/{vmId}/commands` - Create command for VM
- `GET /api/commands/{id}` - Get specific command
- `PUT /api/commands/{id}` - Update command
- `DELETE /api/commands/{id}` - Delete command

#### Command Object Structure
```json
{
  "id": "uuid",
  "vmId": "vm-uuid",
  "name": "docker-ps",
  "cmd": "docker ps --format 'table {{.Names}}\\t{{.Status}}'",
  "type": "stream",
  "description": "List running containers",
  "timeout": 30000,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Job Cache Management

- `GET /api/vms/{vmId}/jobs` - Get cached jobs for VM
- `PUT /api/jobs/{jobId}` - Update/create job cache entry
- `DELETE /api/jobs/{jobId}?vmId={vmId}` - Delete job cache entry

#### Job Cache Object Structure
```json
{
  "vmId": "vm-uuid",
  "jobId": "job-uuid",
  "status": "running",
  "command": "docker ps",
  "type": "stream",
  "createdAt": 1640995200000,
  "updatedAt": 1640995200000,
  "exitCode": null,
  "output": "...",
  "ttl": 1641081600
}
```

## DynamoDB Tables

### VMs Table
- **Primary Key:** `id` (String)
- **GSI:** `NameEnvironmentIndex` - `name` (Hash), `environment` (Range)

### Commands Table
- **Primary Key:** `id` (String)
- **GSI:** `VmIdIndex` - `vmId` (Hash)
- **GSI:** `VmIdNameIndex` - `vmId` (Hash), `name` (Range)

### Job Cache Table
- **Primary Key:** `vmId` (Hash), `jobId` (Range)
- **GSI:** `StatusIndex` - `status` (Hash), `createdAt` (Range)
- **TTL:** 24 hours (automatic cleanup)

## Commands

- `npm run deploy` - Deploy all functions and resources
- `npm run remove` - Remove all AWS resources
- `npm run logs -- functionName` - View function logs
- `npm run invoke -- functionName` - Invoke function locally

## Environment Variables

- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_DYNAMODB_VMS_TABLE` - VMs table name
- `AWS_DYNAMODB_COMMANDS_TABLE` - Commands table name
- `AWS_DYNAMODB_JOB_CACHE_TABLE` - Job cache table name
