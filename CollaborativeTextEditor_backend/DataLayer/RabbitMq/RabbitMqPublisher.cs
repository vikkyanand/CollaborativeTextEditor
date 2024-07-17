using DomainLogic.Supervisor;
using MongoDB.Bson.IO;
using MongoDB.Driver.Core.Connections;
using Newtonsoft.Json;
using RabbitMQ.Client;
using System.Text;
using static MongoDB.Driver.WriteConcern;
using IConnection = RabbitMQ.Client.IConnection;

namespace DataLayer.RabbitMq
{
    public class RabbitMqPublisher : INotificationService
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;

        public RabbitMqPublisher(IConnection connection)
        {
            _connection = connection;
            _channel = _connection.CreateModel();
        }

        public void NotifyDocumentUpdate(string documentId, string content)
        {
            var messageBodyBytes = Encoding.UTF8.GetBytes(content);
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(
                exchange: "",
                routingKey: documentId,
                basicProperties: properties,
                body: messageBodyBytes
            );
        }

        public void NotifyPermissionRevoked(string documentId, string email)
        {
            var message = new { documentId, email };
            var messageBodyBytes = Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(message));
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(
                exchange: "",
                routingKey: "PermissionRevokedQueue",
                basicProperties: properties,
                body: messageBodyBytes
            );

            Console.WriteLine($"Published permission revoked message for document ID: {documentId}, email: {email}");
        }
        public void NotifyDocumentDeleted(string documentId)
        {
            var message = new { documentId };
            var messageBodyBytes = Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(message));
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(
                exchange: "",
                routingKey: "DocumentDeletedQueue",
                basicProperties: properties,
                body: messageBodyBytes
            );

            Console.WriteLine($"Published document deleted message for document ID: {documentId}");
        }


    }
}