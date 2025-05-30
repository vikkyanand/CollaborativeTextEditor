﻿using DataLayer.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using IConnection = RabbitMQ.Client.IConnection;

namespace DataLayer.RabbitMq
{
    public class RabbitMqConsumer : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RabbitMqConsumer> _logger;

        public RabbitMqConsumer(IConnection connection, IServiceProvider serviceProvider, ILogger<RabbitMqConsumer> logger)
        {
            _connection = connection;
            _channel = _connection.CreateModel();
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _channel.QueueDeclare(queue: "PermissionRevokedQueue", durable: true, exclusive: false, autoDelete: false, arguments: null);
            _channel.QueueDeclare(queue: "DocumentDeletedQueue", durable: true, exclusive: false, autoDelete: false, arguments: null);

            var permissionRevokedConsumer = new EventingBasicConsumer(_channel);
            permissionRevokedConsumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var data = JsonConvert.DeserializeObject<dynamic>(message);
                string documentId = data.documentId;
                string email = data.email;

                _logger.LogInformation($"Received permission revoked message for document ID: {documentId}, email: {email}");

                using (var scope = _serviceProvider.CreateScope())
                {
                    var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<WebSocketHub>>();
                    _logger.LogInformation($"Sending permission revoked via SignalR for document ID: {documentId}, email: {email}");
                    await hubContext.Clients.Group(documentId).SendAsync("ReceivePermissionRevoked", email);
                }
            };

            var documentDeletedConsumer = new EventingBasicConsumer(_channel);
            documentDeletedConsumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var data = JsonConvert.DeserializeObject<dynamic>(message);
                string documentId = data.documentId;

                _logger.LogInformation($"Received document deleted message for document ID: {documentId}");

                using (var scope = _serviceProvider.CreateScope())
                {
                    var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<WebSocketHub>>();
                    _logger.LogInformation($"Sending document deleted via SignalR for document ID: {documentId}");
                    await hubContext.Clients.Group(documentId).SendAsync("ReceiveDocumentDeleted", documentId);
                }
            };

            _channel.BasicConsume(queue: "PermissionRevokedQueue", autoAck: true, consumer: permissionRevokedConsumer);
            _channel.BasicConsume(queue: "DocumentDeletedQueue", autoAck: true, consumer: documentDeletedConsumer);

            return Task.CompletedTask;
        }

        public override void Dispose()
        {
            _channel.Close();
            _connection.Close();
            base.Dispose();
        }
    }
}
