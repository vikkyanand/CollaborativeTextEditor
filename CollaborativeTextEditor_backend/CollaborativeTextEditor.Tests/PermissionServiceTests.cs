using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Supervisor;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace CollaborativeTextEditor.Tests
{
    public class PermissionServiceTests
    {
        private readonly Mock<IPermissionRepository> _permissionRepositoryMock;
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly PermissionService _permissionService;

        public PermissionServiceTests()
        {
            _permissionRepositoryMock = new Mock<IPermissionRepository>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _notificationServiceMock = new Mock<INotificationService>();
            _permissionService = new PermissionService(
                _permissionRepositoryMock.Object,
                _userRepositoryMock.Object,
                _notificationServiceMock.Object
            );
        }

        [Fact]
        public async Task GetPermissionsByDocumentId_ShouldReturnPermissions_WhenDocumentExists()
        {
            // Arrange
            var documentId = "doc123";
            var expectedPermissions = new List<Permission>
            {
                new Permission { DocumentId = documentId, Email = "user1@example.com", CanWrite = true },
                new Permission { DocumentId = documentId, Email = "user2@example.com", CanWrite = false }
            };
            _permissionRepositoryMock
                .Setup(repo => repo.GetPermissionsByDocumentId(documentId))
                .ReturnsAsync(expectedPermissions);

            // Act
            var result = await _permissionService.GetPermissionsByDocumentId(documentId);

            // Assert
            Assert.Equal(expectedPermissions, result);
        }

        [Fact]
        public async Task GrantPermission_ShouldCallGrantPermissionOnRepository_WhenUserExists()
        {
            // Arrange
            var documentId = "doc123";
            var email = "user@example.com";
            var canWrite = true;
            var userId = "userId123";
            _userRepositoryMock
                .Setup(repo => repo.GetUserByEmail(email))
                .ReturnsAsync(new User { Id = userId, Email = email });

            // Act
            await _permissionService.GrantPermission(documentId, email, canWrite);

            // Assert
            _permissionRepositoryMock
                .Verify(repo => repo.GrantPermission(documentId, userId, email, canWrite), Times.Once);
        }

        [Fact]
        public async Task GrantPermission_ShouldCallGrantPermissionOnRepository_WhenUserDoesNotExist()
        {
            // Arrange
            var documentId = "doc123";
            var email = "user@example.com";
            var canWrite = true;
            _userRepositoryMock
                .Setup(repo => repo.GetUserByEmail(email))
                .ReturnsAsync((User)null);

            // Act
            await _permissionService.GrantPermission(documentId, email, canWrite);

            // Assert
            _permissionRepositoryMock
                .Verify(repo => repo.GrantPermission(documentId, null, email, canWrite), Times.Once);
        }

        [Fact]
        public async Task RevokePermission_ShouldCallRevokePermissionOnRepositoryAndNotifyService()
        {
            // Arrange
            var documentId = "doc123";
            var email = "user@example.com";

            // Act
            await _permissionService.RevokePermission(documentId, email);

            // Assert
            _permissionRepositoryMock
                .Verify(repo => repo.RevokePermission(documentId, email), Times.Once);
            _notificationServiceMock
                .Verify(service => service.NotifyPermissionRevoked(documentId, email), Times.Once);
        }
    }
}
