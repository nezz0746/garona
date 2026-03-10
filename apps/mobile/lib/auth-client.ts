import { createAuthClient } from "better-auth/react";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import { API_URL } from "./auth";

export const authClient = createAuthClient({
  baseURL: API_URL,
  // @ts-expect-error - expo-better-auth-passkey types lag behind better-auth 1.5.x
  plugins: [expoPasskeyClient()],
});

export const { signIn, signOut, useSession } = authClient;
