import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { feedApi, postsApi } from "../../lib/api";
import type { Comment } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { useCommentsQuery } from "../../hooks/queries/useCommentsQuery";
import { useCommentMutation } from "../../hooks/mutations/useCommentMutation";
import { useLikeMutation } from "../../hooks/mutations/useLikeMutation";
import { RichText } from "../../components/RichText";
import { MentionTextInput } from "../../components/MentionTextInput";
import { LinkPreviewCard } from "../../components/LinkPreviewCard";
import { UsersListSheet } from "../../components/UsersListSheet";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}j`;
}

export default function PostThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [likesVisible, setLikesVisible] = useState(false);

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => feedApi.post(id),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(id);
  const commentMutation = useCommentMutation(id);
  const likeMutation = useLikeMutation();

  const { data: likedUsers = [], isLoading: likesLoading } = useQuery({
    queryKey: queryKeys.postLikes(id),
    queryFn: () => postsApi.likes(id),
    enabled: likesVisible && !!id,
  });

  const handleSend = () => {
    if (!text.trim() || commentMutation.isPending) return;
    commentMutation.mutate(text.trim(), {
      onSuccess: () => setText(""),
    });
  };

  if (postLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-bg justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-text-muted text-base">Publication introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-primary text-[15px] mt-3">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="border-b border-border" style={{ borderBottomWidth: 0.5 }}>
      {/* Author row */}
      <View className="flex-row items-center px-4 pt-3 gap-3">
        <Pressable onPress={() => router.push(`/user/${post.author.username}`)}>
          <Avatar uri={post.author.avatarUrl} name={post.author.name} size={44} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-text font-bold text-[15px]">{post.author.name}</Text>
          <Text className="text-text-muted text-[14px]">@{post.author.username}</Text>
        </View>
        <IconButton name="ellipsis-horizontal" size={20} />
      </View>

      {/* Post body */}
      <View className="px-4 pt-3 pb-3">
        <RichText className="text-text text-[17px] leading-[24px]">
          {post.caption || ""}
        </RichText>

        {/* Link previews */}
        {post.linkPreviews && post.linkPreviews.length > 0 && (
          <View className="mt-2">
            {post.linkPreviews.map((lp) => (
              <LinkPreviewCard key={lp.url} preview={lp} />
            ))}
          </View>
        )}

        {/* Timestamp */}
        <Text className="text-text-muted text-[13px] mt-3">
          {new Date(post.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          {new Date(post.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Engagement bar */}
      <View className="flex-row items-center px-4 py-2 border-t border-border gap-5" style={{ borderTopWidth: 0.5 }}>
        <Pressable className="flex-row items-center gap-1" onPress={onOpenComments}>
          <Text className="text-text font-bold text-[14px]">{post.comments}</Text>
          <Text className="text-text-muted text-[14px]">commentaire{post.comments !== 1 ? "s" : ""}</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1" onPress={() => setLikesVisible(true)}>
          <Text className="text-text font-bold text-[14px]">{post.likes}</Text>
          <Text className="text-text-muted text-[14px]">j'aime</Text>
        </Pressable>
      </View>

      {/* Action buttons */}
      <View className="flex-row items-center justify-around px-4 py-1.5 border-t border-border" style={{ borderTopWidth: 0.5 }}>
        <IconButton name="chatbubble-outline" size={20} onPress={onOpenComments} />
        <IconButton
          name={post.liked ? "heart" : "heart-outline"}
          size={20}
          color={post.liked ? colors.like : colors.textMuted}
          onPress={() => likeMutation.mutate(post.id)}
        />
        <IconButton name="share-outline" size={20} />
      </View>

      {/* Comments header */}
      {comments.length > 0 && (
        <View className="px-4 pt-3 pb-1">
          <Text className="text-text-muted text-[13px] font-semibold">Commentaires</Text>
        </View>
      )}
    </View>
  );

  const onOpenComments = () => {
    inputRef.current?.focus();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="flex-row px-4 py-3 gap-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
      <Pressable onPress={() => router.push(`/user/${item.author.username}`)}>
        <Avatar uri={item.author.avatarUrl} name={item.author.username} size={36} />
      </Pressable>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Pressable onPress={() => router.push(`/user/${item.author.username}`)}>
            <Text className="text-text font-bold text-[14px]">{item.author.name}</Text>
          </Pressable>
          <Text className="text-text-muted text-[13px]">@{item.author.username}</Text>
          <Text className="text-text-muted text-[13px]">· {timeAgo(item.createdAt)}</Text>
        </View>
        <RichText className="text-text text-[15px] leading-[21px] mt-0.5">
          {item.text}
        </RichText>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Post</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Post + comments */}
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderComment}
        ListEmptyComponent={() =>
          commentsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View className="py-[40px] items-center gap-2">
              <Text className="text-text-muted text-[14px]">Aucun commentaire</Text>
              <Text className="text-text-muted text-[13px]">Sois le premier !</Text>
            </View>
          )
        }
      />

      {/* Comment input */}
      <View className="flex-row items-center px-4 py-2.5 border-t border-border gap-2.5" style={{ borderTopWidth: 0.5, paddingBottom: insets.bottom + 10 }}>
        <MentionTextInput
          inputRef={inputRef}
          className="flex-1 bg-surface rounded-[20px] px-4 py-2.5 text-sm text-text max-h-[80px]"
          placeholder="Ajouter un commentaire..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={300}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || commentMutation.isPending}
          className="p-2"
          style={(!text.trim() || commentMutation.isPending) ? { opacity: 0.4 } : undefined}
        >
          {commentMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="send" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <UsersListSheet
        visible={likesVisible}
        onClose={() => setLikesVisible(false)}
        title="J'aime"
        users={likedUsers}
        isLoading={likesLoading}
      />
    </KeyboardAvoidingView>
  );
}
