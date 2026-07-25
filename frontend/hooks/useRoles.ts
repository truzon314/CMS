"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesService } from "@/services/roles";
import { ApiError } from "@/lib/api-client";

const ROLES_KEY = ["roles"];
const PERMISSIONS_KEY = ["permissions"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useRolesList() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: rolesService.list });
}

export function usePermissionsList() {
  return useQuery({ queryKey: PERMISSIONS_KEY, queryFn: rolesService.listPermissions });
}

function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ROLES_KEY });
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => rolesService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Role created.");
    },
    onError: onErrorToast,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (id: string) => rolesService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Role deleted.");
    },
    onError: onErrorToast,
  });
}

export function useUpdateRolePermissions() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      rolesService.updatePermissions(id, permissionIds),
    onSuccess: () => {
      invalidate();
      toast.success("Permissions updated.");
    },
    onError: onErrorToast,
  });
}
