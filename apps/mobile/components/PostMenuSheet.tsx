import { View, Text, Modal, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

type Props = {
  visible: boolean;
  isOwn: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export function PostMenuSheet({ visible, isOwn, onClose, onDelete }: Props) {
  const handleDelete = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        "Supprimer la publication",
        "Es-tu sûr de vouloir supprimer cette publication ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: onDelete },
        ],
      );
    }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={false}>
      <View className="flex-1 bg-bg">
        {/* Handle + header */}
        <View className="items-center py-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <View className="w-10 h-1 rounded-sm bg-border mb-2" />
          <Text className="text-base font-bold text-text">Options</Text>
          <Pressable onPress={onClose} className="absolute right-4 top-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Menu items */}
        <View className="px-4 pt-4 gap-1">
          {isOwn && (
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl bg-surface"
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text className="text-[15px] font-medium" style={{ color: "#ef4444" }}>
                Supprimer la publication
              </Text>
            </Pressable>
          )}

          {!isOwn && (
            <Pressable
              className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl bg-surface"
              onPress={onClose}
            >
              <Ionicons name="flag-outline" size={22} color={colors.text} />
              <Text className="text-[15px] font-medium text-text">
                Signaler
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
