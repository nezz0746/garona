import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchQuery } from "../../hooks/queries/useSearchQuery";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const { data: results = [], isLoading: searching } =
    useSearchQuery(trimmedQuery);

  const showResults = trimmedQuery.length >= 2;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View
        className="flex-row items-center bg-surface rounded-xl mx-4 my-2.5 px-3.5 gap-2.5 border"
        style={{
          borderColor: query.length > 0 ? colors.accentSoft : colors.border,
        }}
      >
        <Ionicons
          name="search"
          size={18}
          color={query.length > 0 ? colors.accent : colors.textMuted}
        />
        <TextInput
          placeholder="Chercher un Toulousain..."
          placeholderTextColor={colors.textMuted}
          className="flex-1 py-2.5 text-sm text-text"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={showResults ? results : []}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center gap-3 px-4 py-2.5"
            onPress={() => router.push(`/user/${item.username}`)}
          >
            <Avatar uri={item.avatarUrl} name={item.name} size={48} />
            <View className="flex-1">
              <Text className="text-text font-semibold text-[15px]">
                {item.name}
              </Text>
              <Text className="text-text-muted text-[13px]">
                @{item.username}
              </Text>
              {item.bio && (
                <Text
                  className="text-text-secondary text-xs mt-0.5"
                  numberOfLines={1}
                >
                  {item.bio}
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ListHeaderComponent={() =>
          showResults && searching ? (
            <View className="px-4 py-5">
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={() => {
          if (!showResults) {
            return (
              <View className="p-10 items-center">
                <Text className="text-text-muted text-sm text-center">
                  Recherche des utilisateurs par nom ou @username
                </Text>
              </View>
            );
          }

          if (!searching) {
            return (
              <View className="p-10 items-center">
                <Text className="text-text-muted text-sm">
                  Aucun résultat pour "{trimmedQuery}"
                </Text>
              </View>
            );
          }

          return null;
        }}
      />
    </View>
  );
}
