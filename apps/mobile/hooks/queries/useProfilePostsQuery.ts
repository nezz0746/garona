import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { profilesApi } from "../../lib/api";

export function useProfilePostsQuery(username: string, limit = 30) {
  return useQuery({
    queryKey: queryKeys.profilePosts(username),
    queryFn: () => profilesApi.postsFeed(username, limit),
    enabled: !!username,
  });
}
