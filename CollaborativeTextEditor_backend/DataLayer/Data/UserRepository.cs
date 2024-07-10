using DomainLogic.Repository.Entities;
using DomainLogic.Repository.Interfaces;
using MongoDB.Driver;
using System.Threading.Tasks;

namespace DataLayer.Data
{

    /// <summary>
    /// Implements the IUserRepository interface to handle user-related database operations.
    /// </summary>
    public class UserRepository : IUserRepository
    {
        private readonly IMongoCollection<User> _users;

        /// <summary>
        /// Constructor that initializes the MongoDB collection for users.
        /// </summary>
        /// <param name="context">The MongoDB context providing access to the database.</param>
        public UserRepository(MongoDbContext context)
        {
            _users = context.Users;
        }

        /// <summary>
        /// Retrieves a user by their email address.
        /// </summary>
        /// <param name="email">The email address of the user to retrieve.</param>
        /// <returns>The matching User object, or null if not found.</returns>
        public async Task<User> GetUserByEmail(string email)
        {
            return await _users.Find(user => user.Email == email).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Creates a new user with the given email and name.
        /// </summary>
        /// <param name="email">The email address of the new user.</param>
        /// <param name="name">The name of the new user.</param>
        /// <returns>The newly created User object.</returns>
        public async Task<User> CreateUser(string email, string name)
        {
            var user = new User { Email = email, Name = name };
            await _users.InsertOneAsync(user);
            return user;
        }
    }
}