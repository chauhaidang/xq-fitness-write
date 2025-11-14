# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XQ Fitness is a full-stack workout management application with a microservices architecture. This project is part of the xq fitness, which is:
- **Write Service**: Node.js/Express microservice (port 3000) for creating/updating/deleting data -> this project

### Service Communication

- Services are independently deployable
- Mobile app calls both services directly (read-only operations to port 8080, mutations to port 3000)
- No inter-service communication; both connect to shared PostgreSQL database
- API base URLs in mobile app require adjustment based on target platform (localhost for simulator, IP for physical device)

## Database Setup
Use published version of database container
`docker pull ghcr.io/chauhaidang/xq-fitness-db:latest`

## API Specifications
- Write Service OpenAPI spec: `./write-service-api.yaml`

## Agent Working instruction
- When working with write-service, go to [write-service](./README.md) to get context, and use agent `backend-nodejs-expert`
- When working with researching, technical solution, api design, architecture, use agent `architecture-advisor`
- When working with testing in test/ or e2e/ directory, use agent `automation-testing-expert` and use [e2e readme](./e2e/README.md) to grasp context
