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
    public class DocumentsControllerTests
    {
        private readonly Mock<IDocumentRepository> _mockDocumentRepository;
        private readonly Mock<ILogger<DocumentsController>> _mockLogger;
        private readonly DocumentsController _controller;

        public DocumentsControllerTests()
        {
            _mockDocumentRepository = new Mock<IDocumentRepository>();
            _mockLogger = new Mock<ILogger<DocumentsController>>();
            var mockDocumentService = new DocumentService(
                _mockDocumentRepository.Object, null, null );
            _controller = new DocumentsController(mockDocumentService, _mockLogger.Object);
        }

        [Fact]
        public async Task GetDocuments_ReturnsOkResult_WithListOfDocuments()
        {
            // Arrange
            var documents = new List<Document>
            {
                new Document { Id = "1", Name = "Doc1" },
                new Document { Id = "2", Name = "Doc2" }
            };
            _mockDocumentRepository.Setup(repo => repo.GetDocuments(It.IsAny<string>()))
                                   .ReturnsAsync(documents);

            // Act
            var result = await _controller.GetDocuments();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<List<Document>>(okResult.Value);
            Assert.Equal(2, returnValue.Count);
        }

        [Fact]
        public async Task GetDocumentContent_ReturnsOkResult_WithDocumentContent()
        {
            // Arrange
            var document = new Document
            {
                Id = "1",
                Name = "New 1",
                Content = "<p>jshshd jpjijijuhjij jbj jjjj kpfjfffjfjjnhjj hjj jiookm oiiooi ihijl</p><p><br></p>",
                DateCreated = DateTime.Parse("2024-07-31T03:57:55.599Z"),
                LastEditedDate = DateTime.Parse("2024-08-01T14:16:35.98Z")
            };

            _mockDocumentRepository.Setup(repo => repo.GetDocumentById("1"))
                                   .ReturnsAsync(document);

            // Act
            var result = await _controller.GetDocumentContent("1");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            // Assert individual properties
            Assert.NotNull(okResult.Value);

            var actualValue = okResult.Value;

            // Use reflection or cast as IDictionary to access properties
            var content = (string)actualValue.GetType().GetProperty("Content").GetValue(actualValue, null);
            var name = (string)actualValue.GetType().GetProperty("Name").GetValue(actualValue, null);
            var dateCreated = (DateTime)actualValue.GetType().GetProperty("DateCreated").GetValue(actualValue, null);
            var lastEditedDate = (DateTime)actualValue.GetType().GetProperty("LastEditedDate").GetValue(actualValue, null);

            Assert.Equal(document.Content, content);
            Assert.Equal(document.Name, name);
            Assert.Equal(document.DateCreated, dateCreated);
            Assert.Equal(document.LastEditedDate, lastEditedDate);
        }




        [Fact]
        public async Task GetDocumentContent_ReturnsNotFound_WhenDocumentNotFound()
        {
            // Arrange
            _mockDocumentRepository.Setup(repo => repo.GetDocumentById("1"))
                                   .ReturnsAsync((Document)null);

            // Act
            var result = await _controller.GetDocumentContent("1");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateDocument_ReturnsOkResult_WithCreatedDocument()
        {
            // Arrange
            var request = new CreateDocumentRequest { Name = "New Document" };
            var document = new Document { Id = "1", Name = "New Document" };
            _mockDocumentRepository.Setup(repo => repo.CreateDocument(request.Name))
                                   .ReturnsAsync(document);

            // Act
            var result = await _controller.CreateDocument(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnValue = Assert.IsType<Document>(okResult.Value);
            Assert.Equal("New Document", returnValue.Name);
        }

        [Fact]
        public async Task UpdateDocumentContent_ReturnsOkResult()
        {
            // Arrange
            var request = new UpdateContentRequest { Content = "Updated Content", Name = "Updated Name" };

            // Act
            var result = await _controller.UpdateDocumentContent("1", request);

            // Assert
            Assert.IsType<OkResult>(result);
            _mockDocumentRepository.Verify(repo => repo.UpdateDocumentContent("1", request.Content, request.Name), Times.Once);
        }

        [Fact]
        public async Task DeleteDocument_ReturnsOkResult()
        {
            // Arrange
            var mockNotificationService = new Mock<INotificationService>();
            var documentService = new DocumentService(
                _mockDocumentRepository.Object,
                null,  // Assuming permissionRepository is not used in DeleteDocument
                mockNotificationService.Object
            );

            var controller = new DocumentsController(documentService, _mockLogger.Object);

            // Act
            var result = await controller.DeleteDocument("1");

            // Assert
            Assert.IsType<OkResult>(result);
            _mockDocumentRepository.Verify(repo => repo.DeleteDocument("1"), Times.Once);
            mockNotificationService.Verify(service => service.NotifyDocumentDeleted("1"), Times.Once);
        }

    }
}
