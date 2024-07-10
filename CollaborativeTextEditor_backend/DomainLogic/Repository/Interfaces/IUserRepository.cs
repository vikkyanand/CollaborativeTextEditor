using DomainLogic.Repository.Entities;
using System.Threading.Tasks;

namespace DomainLogic.Repository.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetUserByEmail(string email);
        Task<User> CreateUser(string email, string name);
    }
}