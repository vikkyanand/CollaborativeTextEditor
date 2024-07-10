using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DataLayer.Data
{

    /// <summary>
    /// Implements the IPermissionRepository interface to handle permission-related database operations.
    /// </summary>
    public class PermissionRepository : IPermissionRepository
    {
        private readonly IMongoCollection<Permission> _permissions;

        /// <summary>
        /// Constructor that initializes the MongoDB collection for permissions.
        /// </summary>
        /// <param name="context">The MongoDB context providing access to the database.</param>
        public PermissionRepository(MongoDbContext context)
        {
            _permissions = context.Permissions;
        }

        /// <summary>
        /// Retrieves all permissions for a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document to get permissions for.</param>
        /// <returns>A list of Permission objects associated with the document.</returns>
        public async Task<List<Permission>> GetPermissionsByDocumentId(string documentId)
        {
            return await _permissions.Find(permission => permission.DocumentId == documentId).ToListAsync();
        }


        public async Task<List<Permission>> GetPermissionsByUserId(string userId)
        {
            return await _permissions.Find(permission => permission.UserId == userId).ToListAsync();
        }


        /// <summary>
        /// Grants or updates a permission for a user on a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="userId">The ID of the user.</param>
        /// <param name="email">The email of the user.</param>
        /// <param name="canWrite">Whether the user has write permission.</param>
        public async Task GrantPermission(string documentId, string userId, string email, bool canWrite)
        {
            var permission = new Permission
            {
                DocumentId = documentId,
                UserId = userId,
                Email = email,
                CanWrite = canWrite
            };

            // Create a filter to find an existing permission for this document and email
            var filter = Builders<Permission>.Filter.And(
                Builders<Permission>.Filter.Eq(p => p.DocumentId, documentId),
                Builders<Permission>.Filter.Eq(p => p.Email, email)
            );

            var existingPermission = await _permissions.Find(filter).FirstOrDefaultAsync();
            if (existingPermission == null)
            {
                // If no existing permission, insert a new one
                await _permissions.InsertOneAsync(permission);
            }
            else
            {
                // If permission exists, replace it with the new one
                await _permissions.ReplaceOneAsync(filter, permission);
            }
        }

        /// <summary>
        /// Revokes a user's permission for a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="email">The email of the user whose permission is being revoked.</param>
        public async Task RevokePermission(string documentId, string email)
        {
            var filter = Builders<Permission>.Filter.And(
                Builders<Permission>.Filter.Eq(p => p.DocumentId, documentId),
                Builders<Permission>.Filter.Eq(p => p.Email, email)
            );

            await _permissions.DeleteOneAsync(filter);
        }
    }
}