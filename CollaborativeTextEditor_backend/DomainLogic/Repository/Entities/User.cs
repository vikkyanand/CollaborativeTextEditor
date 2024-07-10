using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DomainLogic.Repository.Entities
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("email")]
        public string Email { get; set; }

        [BsonElement("name")]
        public string Name { get; set; }
    }
}