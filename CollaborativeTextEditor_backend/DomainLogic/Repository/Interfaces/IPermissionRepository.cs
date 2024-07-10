using DomainLogic.Repository.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DomainLogic.Repository.Interfaces
{
    public interface IPermissionRepository
    {
        Task<List<Permission>> GetPermissionsByDocumentId(string documentId);
        Task<List<Permission>> GetPermissionsByUserId(string userId);
        Task GrantPermission(string documentId, string userId, string email, bool canWrite);
        Task RevokePermission(string documentId, string email);
    }
}