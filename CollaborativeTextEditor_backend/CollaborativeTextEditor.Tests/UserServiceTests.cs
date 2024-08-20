using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Supervisor;
using Moq;
using System;
using System.Threading.Tasks;
using Xunit;

namespace CollaborativeTextEditor.Tests
{
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _userService = new UserService(_userRepositoryMock.Object);
        }

        [Fact]
        public async Task GetUserByEmail_ShouldReturnUser_WhenUserExists()
        {
            // Arrange
            var email = "test@example.com";
            var expectedUser = new User { Email = email };
            _userRepositoryMock.Setup(repo => repo.GetUserByEmail(email)).ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.GetUserByEmail(email);

            // Assert
            Assert.Equal(expectedUser, result);
        }

        [Fact]
        public async Task CreateUser_ShouldReturnUser_WhenValidEmailAndNameProvided()
        {
            // Arrange
            var email = "newuser@example.com";
            var name = "New User";
            var expectedUser = new User { Email = email, Name = name };
            _userRepositoryMock.Setup(repo => repo.CreateUser(email, name)).ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.CreateUser(email, name);

            // Assert
            Assert.Equal(expectedUser, result);
        }

        [Fact]
        public async Task CreateUser_ShouldHandleNullEmailGracefully()
        {
            // Arrange
            string email = null;
            var name = "New User";

            // Act & Assert
            var exception = await Record.ExceptionAsync(() => _userService.CreateUser(email, name));

            // Check that no exception is thrown
            Assert.Null(exception);
        }

        [Fact]
        public async Task CreateUser_ShouldHandleNullNameGracefully()
        {
            // Arrange
            var email = "newuser@example.com";
            string name = null;

            // Act & Assert
            var exception = await Record.ExceptionAsync(() => _userService.CreateUser(email, name));

            // Check that no exception is thrown
            Assert.Null(exception);
        }
    }
}
