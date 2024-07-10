# Use the official Node.js image
FROM node:18 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the environment variables file
COPY .env .env

# Build the application
RUN npm run build

# Use a minimal Node.js image to serve the application
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Entry point
CMD ["nginx", "-g", "daemon off;"]
