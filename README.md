# TNP Demo Trail 1

A full-stack web application demonstrating modern development practices with Node.js, React, and PostgreSQL.

## Stack: Node 16.20.0, Postgres 14, React

### Technology Stack
- **Backend**: Node.js 16.20.0
- **Frontend**: React 18
- **Database**: PostgreSQL 14
- **Infrastructure**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 16.20.0 (for local development)

### Running the Application

```bash
# Start all services with Docker Compose
docker-compose -f infra/docker-compose.yml up

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5432
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
├── backend/          # Node.js API server
├── frontend/         # React application
├── infra/           # Docker configuration
├── docs/            # Project documentation
└── README.md        # This file
```

## TaskMaster Artifacts

For TaskMaster review, please paste artifacts and validation results in the following locations:

- **Task completion validation**: Paste in project root as `TASK_VALIDATION.md`
- **Test results**: Include in `/docs/test-results/`
- **Deployment artifacts**: Place in `/infra/artifacts/`
- **Code review artifacts**: Add to `/docs/reviews/`

## Development

### Local Development Setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Set up environment variables (copy `.env.example` to `.env` in each service)

3. Start services individually:
   ```bash
   # Terminal 1 - Database
   docker-compose -f infra/docker-compose.yml up postgres
   
   # Terminal 2 - Backend
   cd backend && npm start
   
   # Terminal 3 - Frontend
   cd frontend && npm start
   ```

## Contributing

1. Create feature branch from `main`
2. Make changes and test locally
3. Submit pull request with TaskMaster validation
4. Ensure all tests pass before merging
