export interface DashboardStats {
  total_users: number;
  published_pages: number;
  draft_pages: number;
  total_blog_posts: number;
  published_blog_posts: number;
  storage_bytes: number;
  pending_reviews: number;
  recent_activity: {
    id: string;
    user_name: string;
    action: string;
    entity_type: string | null;
    created_at: string;
  }[];
  recent_logins: { id: string; full_name: string; last_login_at: string }[];
  latest_uploads: { id: string; file_name: string; url: string; created_at: string }[];
}
