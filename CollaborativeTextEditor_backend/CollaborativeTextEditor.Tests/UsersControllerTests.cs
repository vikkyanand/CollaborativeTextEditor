using DomainLogic.Models.DTOs;
using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Supervisor;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PresentationLayer.Controllers;
using System.Threading.Tasks;
using Xunit;

namespace PresentationLayer.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<ILogger<UsersController>> _mockLogger;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockLogger = new Mock<ILogger<UsersController>>();
            var mockUserService = new UserService(_mockUserRepository.Object);
            _controller = new UsersController(mockUserService, _mockLogger.Object);
        }

        [Fact]
        public async Task CheckOrCreateUser_ReturnsOkResult_WithExistingUser()
        {
            // Arrange
            var user = new User { Id = "1", Email = "test@example.com", Name = "Test User" };
            _mockUserRepository.Setup(repo => repo.GetUserByEmail("test@example.com"))
                               .ReturnsAsync(user);

            // Act
            var result = await _controller.CheckOrCreateUser(new UserRequest { Email = "test@example.com", Name = "Test User" });

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<User>(okResult.Value);
            Assert.Equal("test@example.com", returnValue.Email);
            Assert.Equal("Test User", returnValue.Name);
        }

        [Fact]
        public async Task CheckOrCreateUser_CreatesNewUser_WhenUserDoesNotExist()
        {
            // Arrange
            _mockUserRepository.Setup(repo => repo.GetUserByEmail("newuser@example.com"))
                               .ReturnsAsync((User)null);

            _mockUserRepository.Setup(repo => repo.CreateUser("newuser@example.com", "New User"))
                               .ReturnsAsync(new User { Id = "2", Email = "newuser@example.com", Name = "New User" });

            // Act
            var result = await _controller.CheckOrCreateUser(new UserRequest { Email = "newuser@example.com", Name = "New User" });

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<User>(okResult.Value);
            Assert.Equal("newuser@example.com", returnValue.Email);
            Assert.Equal("New User", returnValue.Name);
        }

        [Fact]
        public async Task CheckOrCreateUser_ReturnsBadRequest_WhenUserDoesNotExist_AndNameIsMissing()
        {
            // Arrange
            _mockUserRepository.Setup(repo => repo.GetUserByEmail("newuser@example.com"))
                               .ReturnsAsync((User)null);

            // Act
            var result = await _controller.CheckOrCreateUser(new UserRequest { Email = "newuser@example.com" });

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("User does not exist and name is required to create a new user.", badRequestResult.Value);
        }
    }
}
