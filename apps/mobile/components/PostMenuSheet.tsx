import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { BottomSheet } from "./BottomSheet";

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
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-4 gap-1">
        {isOwn && (
          <Pressable
            className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl"
            style={{ backgroundColor: "#fef2f2" }}
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
    </BottomSheet>
  );
}
