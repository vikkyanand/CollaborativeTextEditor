namespace DomainLogic.Supervisor
{
    public interface INotificationService
    {
        void NotifyDocumentUpdate(string documentId, string content);
        void NotifyPermissionRevoked(string documentId, string email);
        void NotifyDocumentDeleted(string documentId); 
    }
}