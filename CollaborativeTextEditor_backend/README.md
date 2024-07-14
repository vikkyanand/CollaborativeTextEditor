# Collaborative Text Editor Backend

This is the backend service for a Collaborative Text Editor application. It provides APIs for document management, user authentication, and real-time collaboration features.

## Technologies Used

- ASP.NET Core
- MongoDB
- RabbitMQ
- SignalR

## Project Structure

The project follows a clean architecture pattern and is organized into the following layers:

- **PresentationLayer**: Contains the API controllers that handle HTTP requests and return responses. It also includes the application startup file.
- **DomainLogic**:
  - **Models**: Contains data transfer objects (DTOs) and MongoDB entity classes.
  - **Repository**: Contains repository interfaces and entities used by repositories.
  - **Supervisor**: Contains services that implement business logic.
- **DataLayer**:
  - **Data**: Implements the repositories and MongoDB context.
  - **RabbitMq**: Contains classes for consuming and publishing RabbitMQ messages.
  - **SignalR**: Contains the SignalR hub for real-time communication.

## Key Features

- Document CRUD operations
- User management
- Permission control for document access
- Real-time document updates using WebSockets
- Asynchronous messaging with RabbitMQ

## Getting Started

### Prerequisites

- .NET 8 SDK
- MongoDB
- RabbitMQ

### Configuration

Update the `appsettings.json` file with your MongoDB and RabbitMQ connection details.

```json
{
  "DatabaseSettings": {
    "ConnectionString": "your_connection_string",
    "DatabaseName": "your_database_name"
  },
  "RabbitMqSettings": {
    "HostName": "your_rabbitmq_host",
    "Port": "your_rabbitmq_port"
  }
}
```

##Running the Application

1. Clone the repository

```bash
git clone https://github.com/vikkyanand/CollaborativeTextEditor_backend
cd CollaborativeTextEditor
```

2. Navigate to the project directory

```bash
cd PresentationLayer
```

3. Restore dependencies

```bash
dotnet restore
```

4. Run the application

```bash
dotnet run
```

The API will be available at http://localhost:5146 by default.

## API Endpoints

### Documents

- GET /api/documents/getdocuments
- GET /api/documents/getdocumentcontent
- POST /api/documents/createdocument
- PUT /api/documents/updatedocumentcontent
- DELETE /api/documents/deletedocument

### Permissions

- GET /api/permissions/getpermissionsbydocumentid
- POST /api/permissions/grantpermission
- DELETE /api/permissions/revokepermission

### Users

-POST /api/users/checkorcreateuser

## Real-time Features

The application uses SignalR for real-time updates. Clients can connect to the WebSocket hub at /ws to receive live document updates and permission changes.

## Logging

The application uses the built-in .NET logging framework. Logs are output to the console by default.

## Swagger Documentation

API documentation is available via Swagger UI when running the application in development mode. Access it at /swagger.

## Contributing

Contributions are welcome! Please create a pull request or open an issue for any features or bug fixes.

## License

...............................
