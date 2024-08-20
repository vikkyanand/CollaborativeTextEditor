using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using DomainLogic.Supervisor;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace CollaborativeTextEditor.Tests
{
    public class DocumentServiceTests
    {
        private readonly Mock<IDocumentRepository> _mockDocumentRepository;
        private readonly Mock<IPermissionRepository> _mockPermissionRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly DocumentService _documentService;

        public DocumentServiceTests()
        {
            _mockDocumentRepository = new Mock<IDocumentRepository>();
            _mockPermissionRepository = new Mock<IPermissionRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _documentService = new DocumentService(_mockDocumentRepository.Object, _mockPermissionRepository.Object, _mockNotificationService.Object);
        }

        [Fact]
        public async Task GetDocuments_ReturnsListOfDocuments()
        {
            // Arrange
            var documents = new List<Document>
            {
                new Document { Id = "1", Name = "Doc1" },
                new Document { Id = "2", Name = "Doc2" }
            };
            _mockDocumentRepository.Setup(repo => repo.GetDocuments(It.IsAny<string>())).ReturnsAsync(documents);

            // Act
            var result = await _documentService.GetDocuments("");

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal("Doc1", result[0].Name);
            Assert.Equal("Doc2", result[1].Name);
        }

        [Fact]
        public async Task CreateDocument_CreatesNewDocument()
        {
            // Arrange
            var document = new Document { Id = "3", Name = "NewDoc" };
            _mockDocumentRepository.Setup(repo => repo.CreateDocument(It.IsAny<string>())).ReturnsAsync(document);

            // Act
            var result = await _documentService.CreateDocument("NewDoc");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("3", result.Id);
            Assert.Equal("NewDoc", result.Name);
        }

        [Fact]
        public async Task UpdateDocumentContent_UpdatesExistingDocument()
        {
            // Arrange
            var documentId = "1";
            var newContent = "Updated Content";
            var newName = "Updated Name";
            _mockDocumentRepository.Setup(repo => repo.UpdateDocumentContent(documentId, newContent, newName)).Returns(Task.CompletedTask);

            // Act
            await _documentService.UpdateDocumentContent(documentId, newContent, newName);

            // Assert
            _mockDocumentRepository.Verify(repo => repo.UpdateDocumentContent(documentId, newContent, newName), Times.Once);
        }

        [Fact]
        public async Task DeleteDocument_DeletesDocumentAndNotifies()
        {
            // Arrange
            var documentId = "1";
            _mockDocumentRepository.Setup(repo => repo.DeleteDocument(documentId)).Returns(Task.CompletedTask);
            _mockNotificationService.Setup(service => service.NotifyDocumentDeleted(documentId)).Verifiable();

            // Act
            await _documentService.DeleteDocument(documentId);

            // Assert
            _mockDocumentRepository.Verify(repo => repo.DeleteDocument(documentId), Times.Once);
            _mockNotificationService.Verify(service => service.NotifyDocumentDeleted(documentId), Times.Once);
        }

        [Fact]
        public async Task GetDocumentById_ReturnsDocument()
        {
            // Arrange
            var documentId = "1";
            var document = new Document { Id = documentId, Name = "Doc1" };
            _mockDocumentRepository.Setup(repo => repo.GetDocumentById(documentId)).ReturnsAsync(document);

            // Act
            var result = await _documentService.GetDocumentById(documentId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(documentId, result.Id);
            Assert.Equal("Doc1", result.Name);
        }

        [Fact]
        public async Task GetDocumentsWithUserPermission_ReturnsFilteredDocuments()
        {
            // Arrange
            var userId = "user1";
            var documents = new List<Document>
            {
                new Document { Id = "1", Name = "Doc1" },
                new Document { Id = "2", Name = "Doc2" }
            };
            var permissions = new List<Permission>
            {
                new Permission { DocumentId = "1", UserId = userId }
            };

            _mockDocumentRepository.Setup(repo => repo.GetDocuments(It.IsAny<string>())).ReturnsAsync(documents);
            _mockPermissionRepository.Setup(repo => repo.GetPermissionsByUserId(userId)).ReturnsAsync(permissions);

            // Act
            var result = await _documentService.GetDocumentsWithUserPermission(userId, 0, 10, "");

            // Assert
            Assert.Single(result);
            Assert.Equal("1", result[0].Id);
        }
    }
}
