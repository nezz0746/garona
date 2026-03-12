import { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { RangProgress } from "../../components/RangProgress";
import { ProfileShareSheet } from "../../components/ProfileShareSheet";
import { UsersListSheet } from "../../components/UsersListSheet";
import { CommentsSheet } from "../../components/CommentsSheet";
import { FeedPostCard } from "../../components/FeedPostCard";
import { ActivityList } from "../../components/ActivityList";
import { useLikeMutation } from "../../hooks/mutations/useLikeMutation";
import { postsApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useProfileQuery } from "../../hooks/queries/useProfileQuery";
import { useProfilePostsQuery } from "../../hooks/queries/useProfilePostsQuery";
import { useVouchesMeQuery } from "../../hooks/queries/useVouchesMeQuery";
import { queryKeys } from "../../lib/queryKeys";
import { profilesApi } from "../../lib/api";

type ProfileTab = "posts" | "activity";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-text font-bold text-base">{value.toLocaleString()}</Text>
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}

function TabSwitcher({ active, onChange }: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <View className="flex-row border-b border-border" style={{ borderBottomWidth: 0.5 }}>
      <Pressable
        className="flex-1 items-center py-3"
        onPress={() => onChange("posts")}
      >
        <Ionicons
          name={active === "posts" ? "grid" : "grid-outline"}
          size={22}
          color={active === "posts" ? colors.text : colors.textMuted}
        />
        {active === "posts" && (
          <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-text rounded-full" />
        )}
      </Pressable>
      <Pressable
        className="flex-1 items-center py-3"
        onPress={() => onChange("activity")}
      >
        <Ionicons
          name={active === "activity" ? "heart" : "heart-outline"}
          size={22}
          color={active === "activity" ? colors.text : colors.textMuted}
        />
        {active === "activity" && (
          <View className="absolute bottom-0 left-[25%] right-[25%] h-[2px] bg-text rounded-full" />
        )}
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileQuery(user?.username || "");
  const { data: userPosts = [] } = useProfilePostsQuery(user?.username || "");
  const { data: vouchInfo } = useVouchesMeQuery();
  const likeMutation = useLikeMutation();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [shareVisible, setShareVisible] = useState(false);
  const [followersVisible, setFollowersVisible] = useState(false);
  const [followingVisible, setFollowingVisible] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [likesPostId, setLikesPostId] = useState<string | null>(null);

  const { data: likedUsers = [], isLoading: likesLoading } = useQuery({
    queryKey: queryKeys.postLikes(likesPostId!),
    queryFn: () => postsApi.likes(likesPostId!),
    enabled: !!likesPostId,
  });

  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: queryKeys.followers(user?.username || ""),
    queryFn: () => profilesApi.followers(user?.username || ""),
    enabled: followersVisible && !!user?.username,
  });

  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: queryKeys.following(user?.username || ""),
    queryFn: () => profilesApi.following(user?.username || ""),
    enabled: followingVisible && !!user?.username,
  });

  if (profileLoading && !profile) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const profileHeader = () => (
    <View>
      {/* Profile info */}
      <View className="flex-row items-center px-4 pt-5 gap-5">
        <Avatar uri={profile?.avatarUrl || user?.avatarUrl} name={profile?.name || user?.name} size={80} />
        <View className="flex-1 flex-row justify-around">
          <Stat label="Posts" value={profile?.posts ?? 0} />
          <Pressable onPress={() => setFollowersVisible(true)}>
            <Stat label="Abonnés" value={profile?.followers ?? 0} />
          </Pressable>
          <Pressable onPress={() => setFollowingVisible(true)}>
            <Stat label="Abonnements" value={profile?.following ?? 0} />
          </Pressable>
        </View>
      </View>

      <View className="px-4 pt-3.5">
        <Text className="text-text font-semibold text-[15px]">{profile?.name || user?.name}</Text>
        {profile?.bio && <Text className="text-text text-[14px] leading-[20px] mt-1">{profile.bio}</Text>}
      </View>

      <RangProgress
        rang={profile?.rang ?? user?.rang ?? 0}
        totalWeight={vouchInfo?.totalWeight ?? 0}
      />

      {/* Buttons */}
      <View className="flex-row px-4 pt-4 gap-2">
        <Pressable
          className="flex-1 bg-surface rounded-lg py-[7px] items-center border border-border"
          onPress={() => router.push("/edit-profile")}
        >
          <Text className="text-primary font-semibold text-[13px]">Modifier le profil</Text>
        </Pressable>
        <Pressable className="flex-1 bg-surface rounded-lg py-[7px] items-center border border-border" onPress={() => setShareVisible(true)}>
          <Text className="text-primary font-semibold text-[13px]">Partager</Text>
        </Pressable>
      </View>

      {/* Tab switcher */}
      <View className="mt-4">
        <TabSwitcher active={activeTab} onChange={setActiveTab} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-4 py-2.5 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Text className="text-xl font-bold text-text">{user?.username || "profil"}</Text>
        <View className="flex-row gap-4">
          <IconButton name="log-out-outline" size={24} onPress={signOut} />
        </View>
      </View>

      {activeTab === "posts" ? (
        <FlatList
          data={userPosts}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={profileHeader}
          ListEmptyComponent={() => (
            <View className="py-16 items-center gap-3">
              <Ionicons name="create-outline" size={40} color={colors.textMuted} />
              <Text className="text-text-muted text-[15px]">Aucune publication</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <FeedPostCard
              post={item}
              onLike={() => likeMutation.mutate(item.id)}
              onOpenComments={() => setCommentPostId(item.id)}
              onOpenLikes={() => setLikesPostId(item.id)}
            />
          )}
        />
      ) : (
        <ActivityList ListHeaderComponent={profileHeader()} />
      )}

      {commentPostId && (
        <CommentsSheet
          postId={commentPostId}
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      )}
      <UsersListSheet
        visible={!!likesPostId}
        onClose={() => setLikesPostId(null)}
        title="J'aime"
        users={likedUsers}
        isLoading={likesLoading}
      />

      <ProfileShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        username={user?.username || ""}
        name={profile?.name || user?.name || ""}
        avatarUrl={profile?.avatarUrl || user?.avatarUrl || null}
      />
      <UsersListSheet
        visible={followersVisible}
        onClose={() => setFollowersVisible(false)}
        title="Abonnés"
        users={followers}
        isLoading={followersLoading}
      />
      <UsersListSheet
        visible={followingVisible}
        onClose={() => setFollowingVisible(false)}
        title="Abonnements"
        users={following}
        isLoading={followingLoading}
      />
    </View>
  );
}
