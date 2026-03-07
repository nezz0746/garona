import {
  View,
  Text,
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
      <View className="flex-1 bg-bg items-center pt-3">
        {/* Handle + close */}
        <View className="w-full items-center pb-2">
          <View className="w-10 h-1 rounded-sm bg-border" />
          <Pressable onPress={onClose} className="absolute right-4 top-0">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Profile card */}
        <View className="items-center py-8 px-6 gap-2">
          <Avatar uri={avatarUrl} name={name} size={64} />
          <Text className="text-xl font-bold text-text mt-2">{name}</Text>
          <Text className="text-[15px] text-text-muted">@{username}</Text>

          {/* QR Code */}
          <View
            className="mt-6 p-4 bg-white rounded-2xl"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <QRCode
              value={profileUrl}
              size={200}
              color={colors.text}
              backgroundColor="#fff"
            />
          </View>

          <Text className="text-[13px] text-text-muted mt-4">Scanne ce code pour voir mon profil</Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 px-6 w-full">
          <Pressable className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border rounded-xl py-3.5" onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
            <Text className="text-primary font-semibold text-[15px]">Partager</Text>
          </Pressable>

          <Pressable className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border rounded-xl py-3.5" onPress={handleCopy}>
            <Ionicons name="copy-outline" size={22} color={colors.primary} />
            <Text className="text-primary font-semibold text-[15px]">Copier le lien</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
