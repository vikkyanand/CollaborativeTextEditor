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
    public class PermissionsController : ControllerBase
    {
        private readonly PermissionService _permissionService;
        private readonly ILogger<PermissionsController> _logger;

        /// <summary>
        /// Constructor that initializes the permission service and logger.
        /// </summary>
        public PermissionsController(PermissionService permissionService, ILogger<PermissionsController> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all permissions for a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document to get permissions for.</param>
        /// <returns>A list of Permission objects associated with the document.</returns>
        [HttpGet]
        public async Task<ActionResult<List<Permission>>> GetPermissionsByDocumentId(string documentId)
        {
            _logger.LogInformation("Fetching permissions for document ID: {Id}", documentId);
            var permissions = await _permissionService.GetPermissionsByDocumentId(documentId);
            return Ok(permissions);
        }

        /// <summary>
        /// Grants a new permission or updates an existing one for a user on a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="request">The permission request containing user email and write access flag.</param>
        [HttpPost]
        public async Task<IActionResult> GrantPermission(string documentId, [FromBody] PermissionRequest request)
        {
            _logger.LogInformation("Granting permission for document ID: {Id} to email: {Email}", documentId, request.Email);
            await _permissionService.GrantPermission(documentId, request.Email, request.CanWrite);
            return Ok();
        }

        /// <summary>
        /// Revokes a user's permission for a specific document.
        /// </summary>
        /// <param name="documentId">The ID of the document.</param>
        /// <param name="request">The permission request containing the user email to revoke.</param>
        [HttpDelete]
        public async Task<IActionResult> RevokePermission(string documentId, [FromBody] PermissionRequest request)
        {
            _logger.LogInformation("Revoking permission for document ID: {Id} from email: {Email}", documentId, request.Email);
            await _permissionService.RevokePermission(documentId, request.Email);
            return Ok();
        }
    }
}