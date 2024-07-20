using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace DataLayer.SignalR
{
    public class WebSocketHub : Hub
    {
        private static ConcurrentDictionary<string, ConcurrentDictionary<string, (string email, int index, int length)>> DocumentUsers = new ConcurrentDictionary<string, ConcurrentDictionary<string, (string email, int index, int length)>>();

        public async Task SendDocumentUpdate(string documentId, string content)
        {
            await Clients.Group(documentId).SendAsync("ReceiveDocumentUpdate", content);
        }

        public async Task UpdateCursorPosition(string documentId, int index, int length)
        {
            if (DocumentUsers.TryGetValue(documentId, out var users) && users.TryGetValue(Context.ConnectionId, out var user))
            {
                var (email, _, _) = user;
                users[Context.ConnectionId] = (email, index, length);
                await Clients.OthersInGroup(documentId).SendAsync("ReceiveCursorPositionUpdate", email, index, length);
                Console.WriteLine($"Cursor position updated for {email} to {index}");
            }
            else
            {
                Console.WriteLine("Failed to update cursor position.");
            }
        }


        public async Task JoinDocumentGroup(string documentId, string email)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);

            DocumentUsers.AddOrUpdate(documentId,
                _ => new ConcurrentDictionary<string, (string email, int index, int length)>(),
                (_, dict) => dict);

            DocumentUsers[documentId][Context.ConnectionId] = (email, 0, 0);

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
                var onlineUsers = users.Values.Select(u => u.email).Distinct().ToList();
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
    }
}
