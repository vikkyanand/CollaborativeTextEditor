using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using System.Threading.Tasks;

namespace DomainLogic.Supervisor
{

    /// <summary>
    /// Service class for managing user-related operations.
    /// </summary>
    public class UserService
    {
        private readonly IUserRepository _userRepository;

        /// <summary>
        /// Initializes a new instance of the UserService class.
        /// </summary>
        /// <param name="userRepository">The user repository implementation.</param>
        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        /// <summary>
        /// Retrieves a user by their email address.
        /// </summary>
        /// <param name="email">The email address of the user to retrieve.</param>
        /// <returns>The user with the specified email address.</returns>
        public async Task<User> GetUserByEmail(string email)
        {
            return await _userRepository.GetUserByEmail(email);
        }

        /// <summary>
        /// Creates a new user with the given email and name.
        /// </summary>
        /// <param name="email">The email address of the new user.</param>
        /// <param name="name">The name of the new user.</param>
        /// <returns>The created user.</returns>
        public async Task<User> CreateUser(string email, string name)
        {
            return await _userRepository.CreateUser(email, name);
        }
    }
}