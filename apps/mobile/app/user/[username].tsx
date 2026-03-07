import { View, Text, Pressable, ActivityIndicator, FlatList, Image, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useProfileQuery } from "../../hooks/queries/useProfileQuery";
import { useProfilePostsQuery } from "../../hooks/queries/useProfilePostsQuery";
import { useFollowMutation } from "../../hooks/mutations/useFollowMutation";
import { PalierBadge } from "../../components/PalierBadge";
import { VouchButton } from "../../components/VouchButton";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-text font-bold text-base">{value.toLocaleString()}</Text>
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfileQuery(username);
  const { data: userPosts = [] } = useProfilePostsQuery(username);
  const followMutation = useFollowMutation(username);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-text-muted text-base">Utilisateur introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-[15px] mt-3">Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">{profile.username}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={userPosts}
        keyExtractor={(i) => i.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP }}
        ListHeaderComponent={() => (
          <View>
            {/* Profile info */}
            <View className="flex-row items-center px-4 pt-4 gap-6">
              <Avatar uri={profile.avatarUrl} name={profile.name} size={80} />
              <View className="flex-1 flex-row justify-around">
                <Stat label="Posts" value={profile.posts} />
                <Stat label="Abonnés" value={profile.followers} />
                <Stat label="Abonnements" value={profile.following} />
              </View>
            </View>

            <View className="px-4 pt-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-text font-semibold text-[15px]">{profile.name}</Text>
                <PalierBadge palier={profile.palier} size="sm" />
              </View>
              {profile.bio && <Text className="text-text text-[13px] mt-1">{profile.bio}</Text>}
            </View>

            {/* Action buttons */}
            {!profile.isMe && (
              <View className="flex-row px-4 pt-4 gap-2">
                <Pressable
                  className={`flex-1 rounded-lg py-2 items-center ${profile.isFollowing ? "bg-surface border border-border" : "bg-primary"}`}
                  onPress={() => followMutation.mutate()}
                >
                  <Text className={`font-semibold text-sm ${profile.isFollowing ? "text-text" : "text-white"}`}>
                    {profile.isFollowing ? "Abonné" : "S'abonner"}
                  </Text>
                </Pressable>
                <VouchButton userId={profile.id} hasVouched={profile.hasVouched} />
              </View>
            )}

            {/* Grid header */}
            <View className="flex-row border-t border-b border-border mt-4" style={{ borderTopWidth: 0.5, borderBottomWidth: 0.5 }}>
              <Pressable className="flex-1 items-center py-2.5 border-b-2 border-primary">
                <Ionicons name="grid-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="py-[60px] items-center gap-3">
            <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
            <Text className="text-text-muted text-[15px]">Aucune publication</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => router.push(`/posts/${username}?startIndex=${index}`)}>
            <Image source={{ uri: item.imageUrl }} style={{ width: TILE, height: TILE }} />
          </Pressable>
        )}
      />
    </View>
  );
}
