using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DataLayer.Data
{ 
    /// <summary>
    /// Implements the IDocumentRepository interface to handle document-related database operations.
    /// </summary>
    public class DocumentRepository : IDocumentRepository
{
    private readonly IMongoCollection<Document> _documents;

    /// <summary>
    /// Constructor that initializes the MongoDB collection for documents.
    /// </summary>
    /// <param name="context">The MongoDB context providing access to the database.</param>
    public DocumentRepository(MongoDbContext context)
    {
        _documents = context.Documents;
    }

    /// <summary>
    /// Retrieves a list of documents based on pagination and search criteria.
    /// </summary>
    /// <param name="skip">Number of documents to skip (for pagination).</param>
    /// <param name="take">Number of documents to take (for pagination).</param>
    /// <param name="search">Optional search string to filter documents by name.</param>
    /// <returns>A list of matching Document objects.</returns>
    public async Task<List<Document>> GetDocuments(string search)
    {
        var filter = Builders<Document>.Filter.Empty;
        if (!string.IsNullOrEmpty(search))
        {
            filter = Builders<Document>.Filter.Regex("Name", new BsonRegularExpression(search, "i"));
        }
        return await _documents.Find(filter).ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific document by its ID.
    /// </summary>
    /// <param name="id">The ID of the document to retrieve.</param>
    /// <returns>The matching Document object, or null if not found.</returns>
    public async Task<Document> GetDocumentById(string id)
    {
        return await _documents.Find(doc => doc.Id == id).FirstOrDefaultAsync();
    }

    /// <summary>
    /// Creates a new document with the given name.
    /// </summary>
    /// <param name="name">The name of the new document.</param>
    /// <returns>The newly created Document object.</returns>
    public async Task<Document> CreateDocument(string name)
    {
        var document = new Document
        {
            Name = name,
            Content = string.Empty,
            DateCreated = DateTime.UtcNow,
            LastEditedDate = DateTime.UtcNow
        };

        await _documents.InsertOneAsync(document);
        return document;
    }

    /// <summary>
    /// Updates the content and name of an existing document.
    /// </summary>
    /// <param name="id">The ID of the document to update.</param>
    /// <param name="content">The new content of the document.</param>
    /// <param name="name">The new name of the document.</param>
    public async Task UpdateDocumentContent(string id, string content, string name)
    {
        var update = Builders<Document>.Update
            .Set(doc => doc.Content, content)
            .Set(doc => doc.Name, name)
            .Set(doc => doc.LastEditedDate, DateTime.UtcNow);
        await _documents.UpdateOneAsync(doc => doc.Id == id, update);
    }

    /// <summary>
    /// Deletes a document with the specified ID.
    /// </summary>
    /// <param name="id">The ID of the document to delete.</param>
    public async Task DeleteDocument(string id)
    {
        await _documents.DeleteOneAsync(doc => doc.Id == id);
    }
}
}