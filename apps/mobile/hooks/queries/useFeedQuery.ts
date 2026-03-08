import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { feedApi } from "../../lib/api";

export function useFeedQuery(type: "discover" | "following" = "discover", limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.feed(type, limit, offset),
    queryFn: () => feedApi[type](limit, offset),
  });
}
