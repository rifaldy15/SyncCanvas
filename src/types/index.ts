// ===========================================
// SyncCanvas — Type Definitions
// ===========================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentCollaborator {
  document_id: string;
  user_id: string;
  role: "editor" | "viewer";
  joined_at: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
