import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { postsApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export function useCreatePostMutation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ imageUrls = [], caption }: { imageUrls?: string[]; caption?: string }) =>
      postsApi.create(imageUrls, caption),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      if (user?.username) {
        qc.invalidateQueries({ queryKey: queryKeys.profile(user.username) });
        qc.invalidateQueries({ queryKey: queryKeys.profilePosts(user.username) });
        qc.invalidateQueries({ queryKey: queryKeys.profilePostsFeed(user.username) });
      }
    },
  });
}
