import { Platform } from "react-native";
import { authClient } from "./auth-client";

// expo-better-auth-passkey registers these at runtime but types don't propagate
const client = authClient as any;

/**
 * Check if passkeys are supported on the current platform.
 */
export async function isPasskeySupported(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" && !!window.PublicKeyCredential;
  }
  return true;
}

/**
 * Register a passkey for the currently authenticated user.
 */
export async function registerPasskey(username?: string): Promise<boolean> {
  try {
    const result = await client.passkey.addPasskey({
      name: `${username}@garona` || "Garona",
    });
    return !!result.data;
  } catch (e) {
    console.log("Passkey registration failed:", e);
    return false;
  }
}

/**
 * Sign in with a passkey.
 */
export async function signInWithPasskey(): Promise<{
  id: string;
  name: string;
} | null> {
  const result = await client.signIn.passkey();

  if (result.error) {
    if (result.error.code === "AUTH_CANCELLED") {
      return null;
    }
    throw new Error(result.error.message || "Authentification échouée");
  }

  if (result.data?.session) {
    return {
      id: result.data.session.userId,
      name: result.data.user?.name || "",
    };
  }

  return null;
}
