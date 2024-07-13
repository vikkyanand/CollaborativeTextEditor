# CollaborativeTextEditor

A web-based collaborative text editor built with .NET 8, React, and TypeScript. This project uses Docker for containerization and GitHub Actions for CI/CD.

## Overview

The CollaborativeTextEditor project is designed to enable real-time text editing with multiple users. The backend is built with .NET 8, and the frontend uses React with TypeScript. The project is containerized using Docker and orchestrated with Docker Compose.

## Features

- Real-time collaborative text editing
- User authentication and authorization
- Document management
- WebSocket integration for real-time updates
- CI/CD pipeline with GitHub Actions

## Prerequisites

- Docker and Docker Compose installed
- A Docker Hub account
- .NET 8 SDK (for local development)
- Node.js and npm (for local development)
- MongoDB (for local development)
- RabbitMQ (for local development)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/vikkyanand/CollaborativeTextEditor
cd CollaborativeTextEditor
```

## Environment Variables

Create a `.env` file in the `CollaborativeTextEditor_frontend` directory with the following content:

```bash
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WEBSOCKET_URL=ws://localhost:8080/ws
```

## Build and Run with Docker Compose

```bash
docker-compose up --build
```

This command will build and start the backend, frontend, MongoDB, and RabbitMQ services.

## Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **RabbitMQ Management Console:** [http://localhost:15672](http://localhost:15672)

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD. The workflow file is located at `.github/workflows/ci-cd.yml`.

### GitHub Actions Workflow

- **build-and-push-backend:** Builds and pushes the backend Docker image to Docker Hub.
- **build-and-push-frontend:** Builds and pushes the frontend Docker image to Docker Hub.
- **deploy:** Pulls the latest Docker images and deploys the application using Docker Compose.

### Secrets

Ensure the following secrets are added to your GitHub repository:

- `DOCKER_USERNAME`: Your Docker Hub username.
- `DOCKER_PASSWORD`: Your Docker Hub password.

## Development

### Backend

Navigate to the backend directory and run the following commands:

```bash
cd CollaborativeTextEditor_backend
dotnet restore
dotnet build
dotnet run --project PresentationLayer
```

### Frontend

Navigate to the frontend directory and run the following commands:

```bash
cd CollaborativeTextEditor_frontend
npm install
npm start
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

....................
