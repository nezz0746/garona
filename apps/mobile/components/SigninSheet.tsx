import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { meApi, type SignupResult } from "../lib/api";
import { isPasskeySupported, signInWithPasskey } from "../lib/passkey";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSignedIn: (user: SignupResult) => void;
};

export function SigninSheet({ visible, onClose, onSignedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyAvailable, setPasskeyAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (visible) {
      isPasskeySupported().then(setPasskeyAvailable);
      setError(null);
    }
  }, [visible]);

  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPasskey();
      if (result) {
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
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-6 items-center gap-4 pb-4">
        <View className="w-[72px] h-[72px] rounded-full bg-surface justify-center items-center">
          <Ionicons name="finger-print-outline" size={40} color={colors.primary} />
        </View>

        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-text">Connexion</Text>
          <Text className="text-[13px] text-text-muted text-center">
            Utilise ta clé d'accès pour te connecter
          </Text>
        </View>

        {error && (
          <View className="flex-row items-center gap-1.5 px-1">
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text className="text-[#ef4444] text-[13px] flex-1">{error}</Text>
          </View>
        )}

        <Pressable
          className="flex-row items-center justify-center gap-2.5 bg-primary rounded-xl py-3.5 w-full"
          style={(loading || passkeyAvailable === false) ? { opacity: 0.5 } : undefined}
          onPress={handlePasskeySignIn}
          disabled={loading || passkeyAvailable === false}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="finger-print-outline" size={20} color="#fff" />
              <Text className="text-white text-[16px] font-bold">Se connecter</Text>
            </>
          )}
        </Pressable>

        {passkeyAvailable === false && (
          <Text className="text-text-muted text-[12px] text-center">
            Passkey non disponible sur cet appareil
          </Text>
        )}
      </View>
    </BottomSheet>
  );
}
