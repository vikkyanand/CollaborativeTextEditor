# Use the official .NET 8 SDK image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory
WORKDIR /source

# Copy the solution file and necessary project files
COPY CollaborativeTextEditor_backend.sln ./
COPY PresentationLayer/PresentationLayer.csproj PresentationLayer/
COPY DomainLogic/DomainLogic.csproj DomainLogic/
COPY DataLayer/DataLayer.csproj DataLayer/

# Restore dependencies
RUN dotnet restore CollaborativeTextEditor_backend.sln

# Copy the rest of the project files
COPY . .

# Publish the project
RUN dotnet publish ./PresentationLayer -c Release -o /app

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Expose port 8080
EXPOSE 8080

# Entry point
ENTRYPOINT ["dotnet", "PresentationLayer.dll"]
