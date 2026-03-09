import {
  View, Text, Modal, Pressable, FlatList, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { router } from "expo-router";

type User = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
};

export function UsersListSheet({ visible, onClose, title, users, isLoading }: Props) {
  const handleUserPress = (username: string) => {
    onClose();
    router.push(`/user/${username}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg">
        {/* Header */}
        <View className="items-center py-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <View className="w-10 h-1 rounded-sm bg-border mb-2" />
          <Text className="text-base font-bold text-text">{title}</Text>
          <Pressable onPress={onClose} className="absolute right-4 top-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View className="flex-1 justify-center items-center gap-2">
            <Text className="text-base font-semibold text-text">Aucun utilisateur</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            contentContainerClassName="py-2"
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center px-4 py-2.5 gap-3"
                onPress={() => handleUserPress(item.username)}
              >
                <Avatar uri={item.avatarUrl} name={item.name} size={44} />
                <View className="flex-1">
                  <Text className="text-text font-semibold text-[14px]">{item.name}</Text>
                  <Text className="text-text-muted text-[13px]">@{item.username}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
