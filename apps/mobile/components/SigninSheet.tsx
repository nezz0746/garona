import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
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
    } catch {
      setError("Impossible de se connecter");
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
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.handle} />
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="finger-print-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>Connexion</Text>

          {passkeyAvailable === false && (
            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textMuted}
              />
              <Text style={styles.noticeText}>
                Passkey non disponible sur cet appareil
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[
              styles.signInBtn,
              (loading || passkeyAvailable === false) && { opacity: 0.5 },
            ]}
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
                <Text style={styles.signInText}>Se connecter avec Passkey</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", paddingVertical: 12 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  closeBtn: { position: "absolute", right: 16, top: 12 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 16,
    paddingTop: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    width: "100%",
  },
  noticeText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1 },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
  },
  signInText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
