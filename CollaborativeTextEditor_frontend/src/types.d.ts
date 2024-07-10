interface Document {
    id: string;
    name: string;
    content: string;
    userPermissions: Record<string, { canWrite: boolean }>;
  }
  