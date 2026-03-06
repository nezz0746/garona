import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { signinApi, meApi, type SignupResult } from "../lib/api";
import { isPasskeySupported, signInWithPasskey } from "../lib/passkey";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSignedIn: (user: SignupResult) => void;
};

export function SigninSheet({ visible, onClose, onSignedIn }: Props) {
  const [username, setUsername] = useState("");
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
      setUsername("");
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
        setError(null); // User cancelled, show username form
      }
    } catch {
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSignIn = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = await signinApi.byUsername(username.trim().toLowerCase());
      onSignedIn(user);
    } catch (e: any) {
      setError(e.message || "Compte introuvable");
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

          <View style={styles.form}>
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
                autoFocus
                maxLength={30}
                onSubmitEditing={handleUsernameSignIn}
              />
            </View>

            {error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <Pressable
            style={[
              styles.signInBtn,
              (!username.trim() || loading) && { opacity: 0.5 },
            ]}
            onPress={handleUsernameSignIn}
            disabled={!username.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signInText}>Se connecter</Text>
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
  form: { width: "100%", gap: 8 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    paddingLeft: 4,
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1 },
  signInBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  signInText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
