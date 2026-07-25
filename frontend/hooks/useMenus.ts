"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { menuService } from "@/services/menu";
import type { MenuItemInput } from "@/types/menu";

export function useMenusList() {
  return useQuery({ queryKey: ["menus"], queryFn: menuService.list });
}

export function useMenu(key: string) {
  return useQuery({ queryKey: ["menus", key], queryFn: () => menuService.get(key) });
}

export function useReplaceMenuItems(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: MenuItemInput[]) => menuService.replaceItems(key, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus", key] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu saved.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong."),
  });
}
