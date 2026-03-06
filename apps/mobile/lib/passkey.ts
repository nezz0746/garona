import { Platform } from "react-native";
import { authClient } from "./auth-client";

/**
 * Register a passkey for the currently authenticated user.
 * Uses Better Auth's passkeyClient which handles:
 * - Challenge generation (server-side)
 * - WebAuthn ceremony (browser on web, native bridge on mobile)
 * - Credential verification & storage (server-side)
 */
export async function registerPasskey(): Promise<boolean> {
  try {
    const { error } = await authClient.passkey.addPasskey();
    if (error) {
      console.log("Passkey registration error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.log("Passkey registration failed:", e);
    return false;
  }
}

/**
 * Sign in with a passkey.
 * Better Auth handles the full WebAuthn authentication flow.
 * Returns the authenticated user or null.
 */
export async function signInWithPasskey(): Promise<{
  id: string;
  name: string;
} | null> {
  try {
    const { data, error } = await authClient.signIn.passkey();
    if (error) {
      console.log("Passkey sign-in error:", error);
      return null;
    }
    if (!data?.user) return null;
    return { id: data.user.id, name: data.user.name };
  } catch (e) {
    console.log("Passkey sign-in failed:", e);
    return null;
  }
}

/**
 * Check if passkeys are supported on the current platform.
 */
export async function isPasskeySupported(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" && !!window.PublicKeyCredential;
  }

  try {
    const { Passkey } = await import("react-native-passkey");
    return Passkey.isSupported();
  } catch {
    return false;
  }
}
