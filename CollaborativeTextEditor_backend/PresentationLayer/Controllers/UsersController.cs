using DomainLogic.Models.DTOs;
using DomainLogic.Supervisor;
using DomainLogic.Models.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace PresentationLayer.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ILogger<UsersController> _logger;

        /// <summary>
        /// Constructor that initializes the user service and logger.
        /// </summary>
        public UsersController(UserService userService, ILogger<UsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Checks if a user exists by email. If not, creates a new user.
        /// </summary>
        /// <param name="request">The user request containing email and name.</param>
        /// <returns>The existing or newly created User object.</returns>
        [HttpPost]
        public async Task<ActionResult<User>> CheckOrCreateUser([FromBody] UserRequest request)
        {
            _logger.LogInformation("Checking or creating user with email: {Email} and name: {Name}", request.Email, request.Name);

            var user = await _userService.GetUserByEmail(request.Email);
            if (user == null)
            {
                if (string.IsNullOrEmpty(request.Name))
                {
                    return BadRequest("User does not exist and name is required to create a new user.");
                }

                _logger.LogInformation("User not found, creating new user with name: {Name}", request.Name);
                user = await _userService.CreateUser(request.Email, request.Name);
            }

            return Ok(user);
        }
    }
}