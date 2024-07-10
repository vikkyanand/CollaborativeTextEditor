# Collaborative Document Editor - Frontend

This project is a collaborative document editor built with React. It allows users to create, edit, and share documents in real-time.

## Features

- User authentication
- Create and edit documents
- Real-time collaboration
- Document permissions management
- Rich text editing with React Quill
- Responsive design with Material-UI

## Prerequisites

Before you begin, ensure you have met the following requirements:

-	React: 18.3.1
-	TypeScript: 5.4.5
-	Quill: 1.3.7

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/vikkyanand/collaborative-editor.git

2. Navigate to the project directory:
      ```sh
   cd collaborative-editor
3. Install the dependencies:
   ```sh
   npm install

5. Create a `.env` file in the root directory and add the following:
   
       REACT_APP_API_URL=https://localhost:7247/api
   

## Running the Application

To run the application in development mode:

    npm install

 Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Building for Production

To build the app for production:
           
    npm run build
    

This builds the app for production to the `build` folder.

## Project Structure

- `src/components`: React components
- `src/pages`: Page components
- `src/contexts`: React context providers
- `src/hooks`: Custom React hooks
- `src/services`: API service functions

## Main Components

- `Editor`: The main document editing component
- `FileList`: Displays a list of user's documents
- `PermissionManager`: Manages document permissions
- `CustomQuill`: Custom React Quill component for rich text editing

## Authentication

The application uses a simple email-based authentication system. Users can log in with their email, and if they're new, they'll be prompted to enter their name.

## Real-time Collaboration

Real-time collaboration is implemented using WebSockets. The `useWebSocket` hook manages the WebSocket connection and handles real-time updates.

## API Integration

The `api.ts` file in the `services` directory contains functions for interacting with the backend API. These include document CRUD operations and permission management.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License
..........................
