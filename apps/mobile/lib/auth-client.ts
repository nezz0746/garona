import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { API_URL } from "./auth";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [passkeyClient()],
});

export const { signIn, signOut, useSession } = authClient;
