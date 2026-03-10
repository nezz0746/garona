import { Platform } from "react-native";
import { API_URL } from "./auth";

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

/**
 * Register a passkey for the currently authenticated user.
 * 1. Get registration options from server
 * 2. Native passkey ceremony via react-native-passkey
 * 3. Send result back to server for verification
 */
export async function registerPasskey(): Promise<boolean> {
  try {
    const { Passkey } = await import("react-native-passkey");

    // 1. Get registration options
    const optionsRes = await fetch(`${API_URL}/api/auth/passkey/generate-register-options`, {
      method: "GET",
      credentials: "include",
    });
    if (!optionsRes.ok) return false;
    const options = await optionsRes.json();

    // 2. Native ceremony
    const result = await Passkey.register(options);

    // 3. Verify with server
    const verifyRes = await fetch(`${API_URL}/api/auth/passkey/verify-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ response: result }),
    });

    return verifyRes.ok;
  } catch (e) {
    console.log("Passkey registration failed:", e);
    return false;
  }
}

/**
 * Sign in with a passkey (native flow).
 * 1. Get authentication options (challenge) from server
 * 2. Native passkey ceremony — iOS shows passkey picker
 * 3. Send assertion to server for verification
 * 4. Server returns session
 */
export async function signInWithPasskey(): Promise<{ id: string; name: string } | null> {
  const { Passkey } = await import("react-native-passkey");

  // 1. Get authentication options
  const optionsRes = await fetch(`${API_URL}/api/auth/passkey/generate-authenticate-options`, {
    method: "GET",
    credentials: "include",
  });
  if (!optionsRes.ok) {
    throw new Error("Impossible de contacter le serveur");
  }
  const options = await optionsRes.json();

  // 2. Native passkey ceremony — iOS shows the passkey picker
  const assertion = await Passkey.authenticate(options);

  // 3. Verify with server
  const verifyRes = await fetch(`${API_URL}/api/auth/passkey/verify-authentication`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ response: assertion }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.message || "Vérification échouée");
  }

  const data = await verifyRes.json();
  if (!data?.session) return null;

  return { id: data.session.userId, name: data.user?.name || "" };
}
