export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  avatar_url?: string;
  created_at?: Date;
  updated_at?: Date;
}
