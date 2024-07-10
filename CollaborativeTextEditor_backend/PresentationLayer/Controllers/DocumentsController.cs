using DomainLogic.Models.DTOs;
using DomainLogic.Supervisor;
using DomainLogic.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PresentationLayer.Controllers
{    
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly DocumentService _documentService;
        private readonly ILogger<DocumentsController> _logger;

        /// <summary>
        /// Constructor that initializes the document service and logger.
        /// </summary>
        public DocumentsController(DocumentService documentService, ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a list of documents with optional pagination and search.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<Document>>> GetDocuments([FromQuery] string search = "")
        {
            _logger.LogInformation("Fetching all documents with search: {Search}", search);
            var documents = await _documentService.GetDocuments(search);
            return Ok(documents);
        }

        /// <summary>
        /// Retrieves the content and metadata of a specific document.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<string>> GetDocumentContent(string id)
        {
            _logger.LogInformation("Fetching content for document ID: {Id}", id);
            var document = await _documentService.GetDocumentById(id);
            if (document == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                document.Content,
                document.Name,
                document.DateCreated,
                document.LastEditedDate
            });
        }

        /// <summary>
        /// Creates a new document.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Document>> CreateDocument([FromBody] CreateDocumentRequest request)
        {
            _logger.LogInformation("Creating a new document with name: {Name}", request.Name);
            var document = await _documentService.CreateDocument(request.Name);
            _logger.LogInformation("Document created with ID: {Id}", document.Id);
            return Ok(document);
        }

        /// <summary>
        /// Updates the content and name of an existing document.
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdateDocumentContent(string id, [FromBody] UpdateContentRequest request)
        {
            _logger.LogInformation("Updating content and name for document ID: {Id}", id);
            await _documentService.UpdateDocumentContent(id, request.Content, request.Name);
            return Ok();
        }

        /// <summary>
        /// Deletes a document.
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> DeleteDocument(string id)
        {
            _logger.LogInformation("Deleting document with ID: {Id}", id);
            await _documentService.DeleteDocument(id);
            return Ok();
        }

        [HttpGet]
        public async Task<ActionResult<List<Document>>> GetDocumentsWithUserPermission([FromQuery] string userId, [FromQuery] int skip = 0, [FromQuery] int take = 10, [FromQuery] string search = "")
        {
            _logger.LogInformation("Fetching documents with user permission for userId: {UserId}, skip: {Skip}, take: {Take}, search: {Search}", userId, skip, take, search);
            var documents = await _documentService.GetDocumentsWithUserPermission(userId, skip, take, search);
            return Ok(documents);
        }
    }
}
