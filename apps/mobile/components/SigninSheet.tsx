import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { meApi, type SignupResult } from "../lib/api";
import { isPasskeySupported, signInWithPasskey } from "../lib/passkey";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSignedIn: (user: SignupResult) => void;
};

export function SigninSheet({ visible, onClose, onSignedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyAvailable, setPasskeyAvailable] = useState<boolean | null>(
    null,
  );
  const [triedPasskey, setTriedPasskey] = useState(false);

  useEffect(() => {
    if (visible) {
      isPasskeySupported().then(setPasskeyAvailable);
      setError(null);
      setTriedPasskey(false);
    }
  }, [visible]);

  // Auto-try passkey on open
  useEffect(() => {
    if (visible && passkeyAvailable && !triedPasskey) {
      setTriedPasskey(true);
      handlePasskeySignIn();
    }
  }, [visible, passkeyAvailable, triedPasskey]);

  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPasskey();
      if (result) {
        // Better Auth session is now active — fetch user profile
        const user = await meApi.get();
        onSignedIn(user);
      } else {
        setError("Connexion annulée");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg">
        <View className="items-center py-3">
          <View className="w-10 h-1 rounded-sm bg-border" />
          <Pressable onPress={onClose} className="absolute right-4 top-3">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View className="flex-1 px-8 items-center gap-4 pt-6">
          <View className="w-[88px] h-[88px] rounded-[44px] bg-surface justify-center items-center">
            <Ionicons
              name="finger-print-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text className="text-2xl font-extrabold text-text">Connexion</Text>

          {passkeyAvailable === false && (
            <View className="flex-row items-center gap-1.5 bg-surface rounded-lg p-3 w-full">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text className="text-text-muted text-[13px] flex-1">
                Passkey non disponible sur cet appareil
              </Text>
            </View>
          )}

          {error && (
            <View className="flex-row items-center gap-1.5 px-1">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-[#ef4444] text-[13px] flex-1">{error}</Text>
            </View>
          )}

          <Pressable
            className="flex-row items-center justify-center gap-2.5 bg-primary rounded-xl py-4 w-full"
            style={(loading || passkeyAvailable === false) ? { opacity: 0.5 } : undefined}
            onPress={handlePasskeySignIn}
            disabled={loading || passkeyAvailable === false}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color="#fff"
                />
                <Text className="text-white text-[17px] font-bold">Se connecter avec Passkey</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
