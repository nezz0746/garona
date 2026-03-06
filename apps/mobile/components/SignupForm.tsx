import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { colors } from "@garona/shared";
import { signupApi, SignupResult } from "../lib/api";
import { registerPasskey, isPasskeySupported } from "../lib/passkey";

type Props = {
  onSignedUp: (user: SignupResult) => void;
  onBack: () => void;
};

export function SignupForm({ onSignedUp, onBack }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    // On web, passkeys use WebAuthn — check browser support
    if (Platform.OS === "web") {
      const supported = await isPasskeySupported();
      setBiometricAvailable(supported);
      setBiometricType(supported ? "Passkey" : null);
      return;
    }

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      setBiometricAvailable(false);
      return;
    }

    setBiometricAvailable(true);
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      setBiometricType("Face ID");
    } else if (
      types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      setBiometricType("Empreinte digitale");
    } else {
      setBiometricType("Biométrie");
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!username || username === autoUsername(name)) {
      setUsername(autoUsername(text));
    }
  };

  function autoUsername(n: string): string {
    return n
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 30);
  }

  const handleSignup = async () => {
    if (!name.trim() || !username.trim()) return;
    setError(null);

    // Step 1: Biometric verification (native only — web uses WebAuthn via passkeys)
    if (biometricAvailable && Platform.OS !== "web") {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme ton identité pour créer ton compte",
        cancelLabel: "Annuler",
        disableDeviceFallback: false,
        fallbackLabel: "Utiliser le code",
      });

      if (!authResult.success) {
        if (authResult.error === "user_cancel") {
          return; // User cancelled, stay on form
        }
        setError("Authentification échouée. Réessaie.");
        return; // Block signup
      }
    }

    // Step 2: Create account
    setLoading(true);
    try {
      const user = await signupApi.create(name.trim(), username.trim());

      // Step 3: Register a passkey for the new account
      try {
        await registerPasskey();
      } catch (e) {
        // Non-blocking — account is created, passkey can be added later
        console.log("Passkey registration skipped:", e);
      }

      onSignedUp(user);
    } catch (e: any) {
      setError(e.message || "Impossible de créer le compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 48 }}>🏠</Text>
        </View>

        <Text style={styles.title}>Créer ton compte</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ton nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Prénom ou pseudo"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={handleNameChange}
              autoFocus
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
            <View style={styles.usernameRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  },
                ]}
                placeholder="ton.username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={(t) =>
                  setUsername(t.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                }
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                onSubmitEditing={handleSignup}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Signup button */}
        {biometricAvailable === false ? (
          // No biometrics — block signup
          <View style={styles.blockedWrap}>
            <View style={styles.blockedIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={32}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.blockedTitle}>Biométrie non disponible</Text>
            <Text style={styles.blockedText}>
              Garona nécessite Face ID ou une empreinte digitale pour sécuriser
              ton compte. Configure la biométrie dans les réglages de ton
              appareil.
            </Text>
          </View>
        ) : (
          <Pressable
            style={[
              styles.signupBtn,
              (!name.trim() || !username.trim() || loading) && { opacity: 0.5 },
            ]}
            onPress={handleSignup}
            disabled={!name.trim() || !username.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={
                    biometricType === "Face ID"
                      ? "scan-outline"
                      : "finger-print-outline"
                  }
                  size={20}
                  color="#fff"
                />
                <Text style={styles.signupText}>
                  {biometricType
                    ? `Créer avec ${biometricType}`
                    : "Créer mon compte"}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { padding: 16 },
  content: { flex: 1, paddingHorizontal: 32, alignItems: "center", gap: 12 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  form: { width: "100%", gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  usernameRow: { flexDirection: "row", alignItems: "center" },
  atSign: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "600",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1 },
  signupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
    marginTop: 8,
  },
  signupText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  blockedWrap: {
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  blockedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  blockedTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  blockedText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
