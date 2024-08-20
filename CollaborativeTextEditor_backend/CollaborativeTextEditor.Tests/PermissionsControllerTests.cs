using DomainLogic.Models.DTOs;
using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Supervisor;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PresentationLayer.Controllers;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace PresentationLayer.Tests.Controllers
{
    public class PermissionsControllerTests
    {
        private readonly Mock<IPermissionRepository> _mockPermissionRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<ILogger<PermissionsController>> _mockLogger;
        private readonly PermissionsController _controller;

        public PermissionsControllerTests()
        {
            _mockPermissionRepository = new Mock<IPermissionRepository>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockLogger = new Mock<ILogger<PermissionsController>>();
            var mockPermissionService = new PermissionService(_mockPermissionRepository.Object, _mockUserRepository.Object, null);
            _controller = new PermissionsController(mockPermissionService, _mockLogger.Object);
        }

        [Fact]
        public async Task GetPermissionsByDocumentId_ReturnsOkResult_WithListOfPermissions()
        {
            // Arrange
            var permissions = new List<Permission>
            {
                new Permission { Id = "1", DocumentId = "doc1", Email = "user1@example.com", CanWrite = true },
                new Permission { Id = "2", DocumentId = "doc1", Email = "user2@example.com", CanWrite = false }
            };
            _mockPermissionRepository.Setup(repo => repo.GetPermissionsByDocumentId("doc1"))
                                     .ReturnsAsync(permissions);

            // Act
            var result = await _controller.GetPermissionsByDocumentId("doc1");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<Permission>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GrantPermission_ReturnsOkResult_WhenPermissionIsGranted()
        {
            // Arrange
            var request = new PermissionRequest { Email = "user@example.com", CanWrite = true };
            _mockUserRepository.Setup(repo => repo.GetUserByEmail(request.Email))
                               .ReturnsAsync(new User { Id = "userId", Email = "user@example.com" });

            // Act
            var result = await _controller.GrantPermission("doc1", request);

            // Assert
            Assert.IsType<OkResult>(result);
            _mockPermissionRepository.Verify(repo => repo.GrantPermission("doc1", "userId", request.Email, request.CanWrite), Times.Once);
        }

        [Fact]
        public async Task RevokePermission_ReturnsOkResult_WhenPermissionIsRevoked()
        {
            // Arrange
            var request = new PermissionRequest { Email = "user@example.com" };

            var mockNotificationService = new Mock<INotificationService>();
            var mockPermissionRepository = new Mock<IPermissionRepository>();
            var mockUserRepository = new Mock<IUserRepository>();

            var permissionService = new PermissionService(mockPermissionRepository.Object, mockUserRepository.Object, mockNotificationService.Object);
            var controller = new PermissionsController(permissionService, _mockLogger.Object);

            // Act
            var result = await controller.RevokePermission("doc1", request);

            // Assert
            Assert.IsType<OkResult>(result);
            mockPermissionRepository.Verify(repo => repo.RevokePermission("doc1", request.Email), Times.Once);
            mockNotificationService.Verify(service => service.NotifyPermissionRevoked("doc1", request.Email), Times.Once);
        }
    }
}
