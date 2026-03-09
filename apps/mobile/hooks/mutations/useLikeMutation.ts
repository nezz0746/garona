import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi, FeedPost } from "../../lib/api";

export function useLikeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.like(postId),
    onMutate: async (postId) => {
      // Cancel and update all feed queries (discover + following)
      await qc.cancelQueries({ queryKey: ["feed"] });

      const snapshots: { key: unknown[]; data: FeedPost[] }[] = [];
      const cache = qc.getQueriesData<FeedPost[]>({ queryKey: ["feed"] });

      for (const [key, data] of cache) {
        if (!data) continue;
        snapshots.push({ key, data });
        qc.setQueryData<FeedPost[]>(key, (old) =>
          old?.map((p) =>
            p.id === postId
              ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
              : p,
          ),
        );
      }

      return { snapshots };
    },
    onError: (_err, _postId, ctx) => {
      // Rollback all feed queries
      for (const { key, data } of ctx?.snapshots ?? []) {
        qc.setQueryData(key, data);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
