# XQ Fitness Write Service

Node.js service for creating, updating, and deleting workout data.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Docker (optional, for containerized deployment)

## Quick Start

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials

4. Make sure the database schema is already created (see the read-service README)

5. Run the service:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The service will start on port 3000 (or the port specified in `.env`).

### Docker Deployment

#### Using Docker Compose (Recommended)

From the project root, run:

```bash
docker-compose up -d
```

This starts all services including the database, read-service, and write-service.

#### Using Pre-built GHCR Images

Pull and run the latest published image:

```bash
docker run -d \
  --name xq-write-service \
  -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=xq_fitness \
  -e DATABASE_USER=xq_user \
  -e DATABASE_PASSWORD=xq_password \
  -e NODE_ENV=production \
  ghcr.io/chauhaidang/xq-fitness-write-service:latest
```

#### Building Docker Image Locally

```bash
docker build -t xq-fitness-write-service:latest .
docker run -d \
  --name xq-write-service \
  -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_NAME=xq_fitness \
  -e DATABASE_USER=xq_user \
  -e DATABASE_PASSWORD=xq_password \
  -e NODE_ENV=production \
  xq-fitness-write-service:latest
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Routines

- `POST /routines` - Create a new routine
- `PUT /routines/{id}` - Update a routine
- `DELETE /routines/{id}` - Delete a routine

### Workout Days

- `POST /workout-days` - Create a workout day
- `PUT /workout-days/{id}` - Update a workout day
- `DELETE /workout-days/{id}` - Delete a workout day

### Workout Day Sets

- `POST /workout-day-sets` - Add sets configuration
- `PUT /workout-day-sets/{id}` - Update sets configuration
- `DELETE /workout-day-sets/{id}` - Delete sets configuration

## Docker Image Publishing

This service is automatically published to GitHub Container Registry (GHCR) on every push to the `main` branch.

### Image Tags

- `latest` - Most recent build from main branch
- `main-<commit-sha>` - Specific commit version (e.g., `main-abc1234f`)

### Pulling Published Images

```bash
docker pull ghcr.io/chauhaidang/xq-fitness-write-service:latest
docker pull ghcr.io/chauhaidang/xq-fitness-write-service:main-abc1234f
```

### GitHub Actions Workflow

See `.github/workflows/publish.yml` for the automatic publishing configuration.

## API Documentation

See the OpenAPI specification at `./write-service-api.yaml`
