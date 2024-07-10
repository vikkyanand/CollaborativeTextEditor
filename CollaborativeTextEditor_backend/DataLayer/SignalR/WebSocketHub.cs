using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace DataLayer.SignalR
{
    public class WebSocketHub : Hub
    {
        private static ConcurrentDictionary<string, ConcurrentDictionary<string, string>> DocumentUsers = new ConcurrentDictionary<string, ConcurrentDictionary<string, string>>();

        public async Task SendDocumentUpdate(string documentId, string content)
        {
            await Clients.Group(documentId).SendAsync("ReceiveDocumentUpdate", content);
        }

        public async Task JoinDocumentGroup(string documentId, string email)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);

            DocumentUsers.AddOrUpdate(documentId,
                _ => new ConcurrentDictionary<string, string>(),
                (_, dict) => dict);

            DocumentUsers[documentId][Context.ConnectionId] = email;

            await UpdateOnlineUsers(documentId);
        }

        public async Task LeaveDocumentGroup(string documentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, documentId);

            if (DocumentUsers.TryGetValue(documentId, out var users))
            {
                users.TryRemove(Context.ConnectionId, out _);
                if (users.IsEmpty)
                {
                    DocumentUsers.TryRemove(documentId, out _);
                }
            }

            await UpdateOnlineUsers(documentId);
        }

        private async Task UpdateOnlineUsers(string documentId)
        {
            if (DocumentUsers.TryGetValue(documentId, out var users))
            {
                var onlineUsers = users.Values.Distinct().ToList();
                await Clients.Group(documentId).SendAsync("UpdateOnlineUsers", onlineUsers);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            foreach (var document in DocumentUsers)
            {
                if (document.Value.TryRemove(Context.ConnectionId, out _))
                {
                    await UpdateOnlineUsers(document.Key);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task PermissionRevoked(string documentId, string email)
        {
            await Clients.Group(documentId).SendAsync("ReceivePermissionRevoked", email);
        }
    }
}