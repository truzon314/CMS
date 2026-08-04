export type ChatConversationStatus = "open" | "closed";
export type ChatMessageSender = "visitor" | "admin" | "auto";

export interface ChatConversation {
  id: string;
  status: ChatConversationStatus;
  has_unread: boolean;
  assigned_to: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: ChatMessageSender;
  body: string;
  created_at: string;
}

export interface ChatConversationThread {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

export interface AutoReplyConfig {
  enabled: boolean;
  message: string;
}
