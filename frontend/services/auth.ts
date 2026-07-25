import { apiFetch } from "@/lib/api-client";
import type { LoginResponseData, User } from "@/types/auth";

export const authService = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponseData>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  refresh: () => apiFetch<{ access_token: string; expires_in: number }>("/api/v1/auth/refresh", { method: "POST" }),

  logout: () => apiFetch<{ logged_out: boolean }>("/api/v1/auth/logout", { method: "POST" }),

  me: () => apiFetch<User>("/api/v1/auth/me"),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ reset: boolean }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    }),
};
