using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DomainLogic.Repository.Entities
{
    public class Permission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("documentId")]
        public string DocumentId { get; set; }

        [BsonElement("email")]
        public string Email { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; }

        [BsonElement("canWrite")]
        public bool CanWrite { get; set; }
    }
}