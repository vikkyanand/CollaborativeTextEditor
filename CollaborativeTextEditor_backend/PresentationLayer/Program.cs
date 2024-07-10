// File: Program.cs
using DataLayer.Data;
using DataLayer.RabbitMq;
using DataLayer.SignalR;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Repository.Entities;
using DomainLogic.Supervisor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure MongoDB
builder.Services.Configure<DatabaseSettings>(builder.Configuration.GetSection("DatabaseSettings"));
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<IDocumentRepository, DocumentRepository>();
builder.Services.AddSingleton<IPermissionRepository, PermissionRepository>();
builder.Services.AddSingleton<IUserRepository, UserRepository>();
builder.Services.AddSingleton<DocumentService>();
builder.Services.AddSingleton<PermissionService>();
builder.Services.AddSingleton<UserService>();

// Configure RabbitMQ
var rabbitMqConnectionFactory = new ConnectionFactory
{
    HostName = builder.Configuration.GetValue<string>("RabbitMqSettings:HostName"),
    Port = builder.Configuration.GetValue<int>("RabbitMqSettings:Port")
};
var rabbitMqConnection = rabbitMqConnectionFactory.CreateConnection();
builder.Services.AddSingleton<IConnection>(rabbitMqConnection);
builder.Services.AddSingleton<INotificationService, RabbitMqPublisher>();
builder.Services.AddHostedService<RabbitMqConsumer>();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
      builder => builder
      .AllowAnyMethod()
      .AllowAnyHeader()
      .SetIsOriginAllowed((host) => true)
      .AllowCredentials());
});

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Add CORS middleware
app.UseCors("CorsPolicy");

// Add Swagger middleware
app.UseSwagger();
app.UseSwaggerUI();

// Add other middleware
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHub<WebSocketHub>("/ws");
app.Run();
