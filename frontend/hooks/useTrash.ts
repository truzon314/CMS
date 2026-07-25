import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { trashService } from "@/services/trash";
import type { TrashEntityType } from "@/types/trash";

const TRASH_KEY = ["trash"];

function onErrorToast(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

export function useTrashList(params: { entityType?: TrashEntityType; page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...TRASH_KEY, params],
    queryFn: () => trashService.list(params),
  });
}

export function useRestoreTrashItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, id }: { entityType: TrashEntityType; id: string }) =>
      trashService.restore(entityType, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRASH_KEY });
      toast.success("Restored.");
    },
    onError: onErrorToast,
  });
}
