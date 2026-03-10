import { useState, useRef } from "react";
import {
  View, Text, Pressable, FlatList, Image, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { feedApi, postsApi, type Reply } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
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
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [likesVisible, setLikesVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: queryKeys.post(id),
    queryFn: () => feedApi.post(id),
    enabled: !!id,
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["replies", id],
    queryFn: () => postsApi.replies(id),
    enabled: !!id,
  });

  const postLikeMutation = useLikeMutation();

  const replyLikeMutation = useMutation({
    mutationFn: (replyId: string) => postsApi.like(replyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["replies", id] });
    },
  });

  const { data: likedUsers = [], isLoading: likesLoading } = useQuery({
    queryKey: queryKeys.postLikes(id),
    queryFn: () => postsApi.likes(id),
    enabled: likesVisible && !!id,
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, text }: { parentId: string; text: string }) =>
      postsApi.reply(parentId, text),
    onSuccess: () => {
      setText("");
      setReplyingTo(null);
      qc.invalidateQueries({ queryKey: ["replies", id] });
      qc.invalidateQueries({ queryKey: queryKeys.post(id) });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    const targetId = replyingTo?.id || id;
    replyMutation.mutate({ parentId: targetId, text: text.trim() });
  };

  const handleReplyTo = (reply: Reply) => {
    setReplyingTo({ id: reply.id, username: reply.author.username });
    setText(`@${reply.author.username} `);
    inputRef.current?.focus();
  };

  const handleShare = async () => {
    const url = `https://garona.city/post/${id}`;
    try {
      await Share.share({ message: url, url });
    } catch {}
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

  const postImages = post.imageUrls && post.imageUrls.length > 0
    ? post.imageUrls
    : post.imageUrl ? [post.imageUrl] : [];

  const replyCount = post.replies ?? post.comments ?? 0;

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
        {post.caption ? (
          <RichText
            className="text-text text-[17px] leading-[24px]"
            hideUrls={post.linkPreviews?.map((lp) => lp.url)}
          >
            {post.caption}
          </RichText>
        ) : null}

        {/* Images */}
        {postImages.length > 0 && (
          <View className="mt-3">
            {postImages.map((uri, i) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width: "100%", height: 300, borderRadius: 12, marginBottom: i < postImages.length - 1 ? 4 : 0 }}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

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
            day: "numeric", month: "long", year: "numeric",
          })}{" "}
          {new Date(post.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit", minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Engagement bar */}
      <View className="flex-row items-center px-4 py-2 border-t border-border gap-5" style={{ borderTopWidth: 0.5 }}>
        <Pressable className="flex-row items-center gap-1" onPress={() => inputRef.current?.focus()}>
          <Text className="text-text font-bold text-[14px]">{replyCount}</Text>
          <Text className="text-text-muted text-[14px]">réponse{replyCount !== 1 ? "s" : ""}</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1" onPress={() => setLikesVisible(true)}>
          <Text className="text-text font-bold text-[14px]">{post.likes}</Text>
          <Text className="text-text-muted text-[14px]">j'aime</Text>
        </Pressable>
      </View>

      {/* Action buttons */}
      <View className="flex-row items-center justify-around px-4 py-1.5 border-t border-border" style={{ borderTopWidth: 0.5 }}>
        <IconButton name="chatbubble-outline" size={20} onPress={() => inputRef.current?.focus()} />
        <IconButton
          name={post.liked ? "heart" : "heart-outline"}
          size={20}
          color={post.liked ? colors.like : colors.textMuted}
          onPress={() => postLikeMutation.mutate(post.id)}
        />
        <IconButton name="share-outline" size={20} onPress={handleShare} />
      </View>

      {/* Replies header */}
      {replies.length > 0 && (
        <View className="px-4 pt-3 pb-1">
          <Text className="text-text-muted text-[13px] font-semibold">Réponses</Text>
        </View>
      )}
    </View>
  );

  const renderReply = ({ item }: { item: Reply }) => {
    const images = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl ? [item.imageUrl] : [];

    return (
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

          {item.caption ? (
            <RichText className="text-text text-[15px] leading-[21px] mt-0.5">
              {item.caption}
            </RichText>
          ) : null}

          {/* Images in reply */}
          {images.length > 0 && (
            <View className="mt-2">
              <Image
                source={{ uri: images[0] }}
                style={{ width: "100%", height: 180, borderRadius: 10 }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Engagement row */}
          <View className="flex-row items-center mt-2 gap-5">
            <Pressable
              className="flex-row items-center gap-1"
              onPress={() => handleReplyTo(item)}
            >
              <Ionicons name="chatbubble-outline" size={15} color={colors.textMuted} />
              {item.replies > 0 && (
                <Text className="text-text-muted text-[13px]">{item.replies}</Text>
              )}
            </Pressable>
            <Pressable
              className="flex-row items-center gap-1"
              onPress={() => replyLikeMutation.mutate(item.id)}
            >
              <Ionicons
                name={item.liked ? "heart" : "heart-outline"}
                size={16}
                color={item.liked ? colors.like : colors.textMuted}
              />
              {item.likes > 0 && (
                <Text className="text-text-muted text-[13px]">{item.likes}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Nav header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Post</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Post + replies */}
      <FlatList
        data={replies}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderReply}
        ListEmptyComponent={() =>
          repliesLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View className="py-[40px] items-center gap-2">
              <Text className="text-text-muted text-[14px]">Aucune réponse</Text>
              <Text className="text-text-muted text-[13px]">Sois le premier !</Text>
            </View>
          )
        }
      />

      {/* Reply input */}
      <View style={{ borderTopWidth: 0.5 }} className="border-t border-border">
        {replyingTo && (
          <View className="flex-row items-center px-4 py-1.5 bg-surface gap-2">
            <Text className="text-text-muted text-[12px] flex-1">
              Réponse à <Text className="font-semibold text-text">@{replyingTo.username}</Text>
            </Text>
            <Pressable onPress={() => { setReplyingTo(null); setText(""); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
        <View className="flex-row items-center px-4 py-2.5 gap-2.5" style={{ paddingBottom: insets.bottom + 10 }}>
          <MentionTextInput
            inputRef={inputRef}
            className="flex-1 bg-surface rounded-[20px] px-4 py-2.5 text-sm text-text max-h-[80px]"
            placeholder={replyingTo ? `Répondre à @${replyingTo.username}...` : "Répondre..."}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || replyMutation.isPending}
            className="p-2"
            style={(!text.trim() || replyMutation.isPending) ? { opacity: 0.4 } : undefined}
          >
            {replyMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="send" size={20} color={colors.primary} />
            )}
          </Pressable>
        </View>
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
