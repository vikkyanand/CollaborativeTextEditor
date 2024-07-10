using DataLayer.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver.Core.Connections;
using Newtonsoft.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using static MongoDB.Driver.WriteConcern;
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

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
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

            _channel.BasicConsume(queue: "PermissionRevokedQueue", autoAck: true, consumer: consumer);
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
