using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DomainLogic.Supervisor
{
    /// <summary>
    /// Service class for managing document permissions.
    /// </summary>
    public class PermissionService
    {
        private readonly IPermissionRepository _permissionRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;

        /// <summary>
        /// Initializes a new instance of the PermissionService class.
        /// </summary>
        /// <param name="permissionRepository">The permission repository implementation.</param>
        /// <param name="userRepository">The user repository implementation.</param>
        /// <param name="notificationService">The notification service implementation.</param>
        public PermissionService(IPermissionRepository permissionRepository, IUserRepository userRepository, INotificationService notificationService)
        {
            _permissionRepository = permissionRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Retrieves all permissions for a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <returns>A list of permissions for the specified document.</returns>
        public async Task<List<Permission>> GetPermissionsByDocumentId(string documentId)
        {
            return await _permissionRepository.GetPermissionsByDocumentId(documentId);
        }

        /// <summary>
        /// Grants permission to a user for a specific document. If the user doesn't exist, 
        /// the permission is still granted with a null userId.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="email">The email of the user to grant permission to.</param>
        /// <param name="canWrite">Whether the user should have write permission.</param>
        public async Task GrantPermission(string documentId, string email, bool canWrite)
        {
            // Attempt to find the user by email
            var user = await _userRepository.GetUserByEmail(email);

            // If user is found, use their ID; otherwise, use null
            string? userId = user?.Id;

            // Grant permission using the repository
            // If user wasn't found, userId will be null
            await _permissionRepository.GrantPermission(documentId, userId, email, canWrite);
        }

        /// <summary>
        /// Revokes permission for a user on a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="email">The email of the user to revoke permission from.</param>
        public async Task RevokePermission(string documentId, string email)
        {
            await _permissionRepository.RevokePermission(documentId, email);
            _notificationService.NotifyPermissionRevoked(documentId, email);
        }
    }
}