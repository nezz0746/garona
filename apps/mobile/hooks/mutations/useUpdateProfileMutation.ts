import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { meApi } from "../../lib/api";

export function useUpdateProfileMutation(username: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; bio?: string; avatarUrl?: string }) =>
      meApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(username) });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
    },
  });
}
