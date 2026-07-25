import type { User } from "@/types/auth";

export type { User };

export interface UserCreateInput {
  email: string;
  full_name: string;
  role_id: string;
  password?: string;
}

export interface UserUpdateInput {
  full_name?: string;
  role_id?: string;
  is_active?: boolean;
}
