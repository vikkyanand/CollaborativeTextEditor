using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DomainLogic.Supervisor
{
    public class DocumentService
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly IPermissionRepository _permissionRepository;

        public DocumentService(IDocumentRepository documentRepository, IPermissionRepository permissionRepository)
        {
            _documentRepository = documentRepository;
            _permissionRepository = permissionRepository;
        }

        public async Task<List<Document>> GetDocuments(string search)
        {
            return await _documentRepository.GetDocuments(search);
        }

        public async Task<Document> GetDocumentById(string id)
        {
            return await _documentRepository.GetDocumentById(id);
        }

        public async Task<Document> CreateDocument(string name)
        {
            return await _documentRepository.CreateDocument(name);
        }

        public async Task UpdateDocumentContent(string id, string content, string name)
        {
            await _documentRepository.UpdateDocumentContent(id, content, name);
        }

        public async Task DeleteDocument(string id)
        {
            await _documentRepository.DeleteDocument(id);
        }

        public async Task<List<Document>> GetDocumentsWithUserPermission(string userId, int skip, int take, string search)
        {
            var allDocuments = await _documentRepository.GetDocuments(search);
            var userPermissions = await _permissionRepository.GetPermissionsByUserId(userId);
            var documentIdsWithPermission = userPermissions.Select(p => p.DocumentId).ToHashSet();
            var filteredDocuments = allDocuments.Where(doc => documentIdsWithPermission.Contains(doc.Id)).Skip(skip).Take(take).ToList();
            return filteredDocuments;
        }
    }
}