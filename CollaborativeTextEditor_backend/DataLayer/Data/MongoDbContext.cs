using DomainLogic.Repository.Entities;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Reflection.Metadata;
using System.Security;
using Document = DomainLogic.Repository.Entities.Document;

namespace DataLayer.Data
{
    /// <summary>
    /// Provides a context for MongoDB operations, including access to collections.
    /// </summary>
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        /// <summary>
        /// Constructor that initializes the MongoDB connection and database.
        /// </summary>
        /// <param name="settings">Configuration settings for the MongoDB connection.</param>
        public MongoDbContext(IOptions<DatabaseSettings> settings)
        {
            // Create a new MongoDB client using the connection string from settings
            var client = new MongoClient(settings.Value.ConnectionString);
            // Get the database instance using the database name from settings
            _database = client.GetDatabase(settings.Value.DatabaseName);
        }

        // Properties to access specific collections in the database
        public IMongoCollection<Document> Documents => _database.GetCollection<Document>("Documents");
        public IMongoCollection<Permission> Permissions => _database.GetCollection<Permission>("Permissions");
        public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
    }
}