"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersService } from "@/services/users";
import { ApiError } from "@/lib/api-client";
import type { UserCreateInput, UserUpdateInput } from "@/types/user";

const USERS_KEY = ["users"];

export function useUsers(params: { page?: number; search?: string } = {}) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => usersService.list({ page: params.page, search: params.search, perPage: 20 }),
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USERS_KEY });
}

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (payload: UserCreateInput) => usersService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("User created.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdateInput }) => usersService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("User updated.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("User deleted.");
    },
    onError: onErrorToast,
  });
}
