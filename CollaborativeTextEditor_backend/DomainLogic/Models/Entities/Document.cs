using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace DomainLogic.Models.Entities
{
    public class Document
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        public string Name { get; set; }
        public string Content { get; set; }
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public DateTime LastEditedDate { get; set; } = DateTime.UtcNow;
    }
}