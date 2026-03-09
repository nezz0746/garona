import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { colors } from "@garona/shared";
import { signupApi, SignupResult } from "../lib/api";
import { registerPasskey, isPasskeySupported } from "../lib/passkey";

type Props = {
  onSignedUp: (user: SignupResult) => void;
  onBack: () => void;
};

export function SignupForm({ onSignedUp, onBack }: Props) {
  const insets = useSafeAreaInsets();
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
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={onBack} className="p-4" style={{ paddingTop: insets.top + 16 }}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View className="flex-1 px-8 items-center gap-3">
        <View className="w-[88px] h-[88px] rounded-[44px] bg-surface justify-center items-center mb-1">
          <Text style={{ fontSize: 48 }}>🏠</Text>
        </View>

        <Text className="text-2xl font-extrabold text-text mb-2">Créer ton compte</Text>

        <View className="w-full gap-4">
          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold text-text pl-1">Ton nom</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-base text-text"
              placeholder="Prénom ou pseudo"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={handleNameChange}
              autoFocus
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold text-text pl-1">Nom d'utilisateur</Text>
            <View className="flex-row items-center">
              <Text className="bg-surface border border-border border-r-0 rounded-tl-xl rounded-bl-xl px-3.5 py-3.5 text-base text-text-muted font-semibold">@</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-base text-text flex-1"
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
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
            <View className="flex-row items-center gap-1.5 px-1">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-[#ef4444] text-[13px] flex-1">{error}</Text>
            </View>
          )}
        </View>

        {/* Signup button */}
        {biometricAvailable === false ? (
          // No biometrics — block signup
          <View className="items-center gap-2 mt-4 px-2">
            <View className="w-16 h-16 rounded-full bg-surface justify-center items-center">
              <Ionicons
                name="lock-closed-outline"
                size={32}
                color={colors.textMuted}
              />
            </View>
            <Text className="text-base font-bold text-text">Biométrie non disponible</Text>
            <Text className="text-[13px] text-text-muted text-center leading-5">
              Garona nécessite Face ID ou une empreinte digitale pour sécuriser
              ton compte. Configure la biométrie dans les réglages de ton
              appareil.
            </Text>
          </View>
        ) : (
          <Pressable
            className="flex-row items-center justify-center gap-2.5 bg-primary rounded-xl py-4 w-full mt-2"
            style={(!name.trim() || !username.trim() || loading) ? { opacity: 0.5 } : undefined}
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
                <Text className="text-white text-[17px] font-bold">
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
