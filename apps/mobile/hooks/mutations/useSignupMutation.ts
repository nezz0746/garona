import { useMutation } from "@tanstack/react-query";
import { signupApi } from "../../lib/api";

export function useSignupMutation() {
  return useMutation({
    mutationFn: ({ name, username }: { name: string; username: string }) =>
      signupApi.create(name, username),
  });
}
