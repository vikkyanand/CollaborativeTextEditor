using DomainLogic.Repository.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DomainLogic.Repository.Interfaces
{
    public interface IDocumentRepository
    {
        Task<List<Document>> GetDocuments(string search);
        Task<Document> GetDocumentById(string id);
        Task<Document> CreateDocument(string name);
        Task UpdateDocumentContent(string id, string content, string name);
        Task DeleteDocument(string id);
    }
}