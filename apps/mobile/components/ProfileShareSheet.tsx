import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";

type Props = {
  visible: boolean;
  onClose: () => void;
  username: string;
  name: string;
  avatarUrl: string | null;
};

export function ProfileShareSheet({
  visible,
  onClose,
  username,
  name,
  avatarUrl,
}: Props) {
  const profileUrl = `https://garona.econome.studio/@${username}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Retrouve-moi sur Garona !\n${profileUrl}`,
        url: profileUrl,
      });
    } catch {}
  };

  const handleCopy = async () => {
    try {
      const Clipboard = require("expo-clipboard");
      await Clipboard.setStringAsync(profileUrl);
      Alert.alert("Copié !", "Le lien a été copié dans le presse-papier");
    } catch {
      // Fallback: share sheet as copy workaround
      await Share.share({ message: profileUrl });
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
        {/* Handle + close */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile card */}
        <View style={styles.card}>
          <Avatar uri={avatarUrl} name={name} size={64} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>

          {/* QR Code */}
          <View style={styles.qrWrap}>
            <QRCode
              value={profileUrl}
              size={200}
              color={colors.text}
              backgroundColor="#fff"
            />
          </View>

          <Text style={styles.hint}>Scanne ce code pour voir mon profil</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
            <Text style={styles.actionText}>Partager</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={22} color={colors.primary} />
            <Text style={styles.actionText}>Copier le lien</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    paddingTop: 12,
  },
  header: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  closeBtn: { position: "absolute", right: 16, top: 0 },
  card: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  name: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 8 },
  username: { fontSize: 15, color: colors.textMuted },
  qrWrap: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 16 },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionText: { color: colors.primary, fontWeight: "600", fontSize: 15 },
});
