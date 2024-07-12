# Use the official .NET 8 SDK image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base

# Set the working directory
WORKDIR /app

# Build runtime image
FROM base AS final
WORKDIR /app
COPY ["PresentationLayer/bin/Release/net8.0/publish", "/app"]

# Expose port 8080
EXPOSE 8080

# Entry point
ENTRYPOINT ["dotnet", "PresentationLayer.dll"]
