import { useState, useRef } from "react";
import {
  View, Text, Modal, Pressable, FlatList, Image,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar, IconButton } from "@garona/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi, type Reply } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { useCommentMutation } from "../hooks/mutations/useCommentMutation";
import { MentionTextInput } from "./MentionTextInput";
import { RichText } from "./RichText";

type Props = {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
};

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

export function CommentsSheet({ postId, visible, onClose }: Props) {
  const qc = useQueryClient();
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ["replies", postId],
    queryFn: () => postsApi.replies(postId!),
    enabled: visible && !!postId,
  });
  const commentMutation = useCommentMutation(postId || "");
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const likeMutation = useMutation({
    mutationFn: (replyId: string) => postsApi.like(replyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["replies", postId] });
    },
  });

  const handleSend = () => {
    if (!text.trim() || !postId || commentMutation.isPending) return;
    commentMutation.mutate(text.trim(), {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: ["replies", postId] });
      },
    });
  };

  const renderReply = ({ item }: { item: Reply }) => {
    const images = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl ? [item.imageUrl] : [];

    return (
      <View className="flex-row px-3.5 py-3 gap-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => { onClose(); router.push(`/user/${item.author.username}`); }}>
          <Avatar uri={item.author.avatarUrl} name={item.author.username} size={32} />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Pressable onPress={() => { onClose(); router.push(`/user/${item.author.username}`); }}>
              <Text className="text-text font-bold text-[14px]">{item.author.name}</Text>
            </Pressable>
            <Text className="text-text-muted text-[13px]">@{item.author.username}</Text>
            <Text className="text-text-muted text-[13px]">· {timeAgo(item.createdAt)}</Text>
          </View>

          {item.caption ? (
            <RichText className="text-text text-[14px] leading-[20px] mt-0.5">
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
          <View className="flex-row items-center mt-1.5 gap-4">
            <Pressable
              className="flex-row items-center gap-1"
              onPress={() => likeMutation.mutate(item.id)}
            >
              <Ionicons
                name={item.liked ? "heart" : "heart-outline"}
                size={15}
                color={item.liked ? colors.like : colors.textMuted}
              />
              {item.likes > 0 && (
                <Text className="text-text-muted text-[12px]">{item.likes}</Text>
              )}
            </Pressable>
            {item.replies > 0 && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                <Text className="text-text-muted text-[12px]">{item.replies}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="items-center py-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <View className="w-10 h-1 rounded-sm bg-border mb-2" />
          <Text className="text-base font-bold text-text">Réponses</Text>
          <Pressable onPress={onClose} className="absolute right-4 top-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Replies list */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center gap-2">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : replies.length === 0 ? (
          <View className="flex-1 justify-center items-center gap-2">
            <Text className="text-base font-semibold text-text">Aucune réponse</Text>
            <Text className="text-sm text-text-muted">Sois le premier à répondre !</Text>
          </View>
        ) : (
          <FlatList
            data={replies}
            keyExtractor={(r) => r.id}
            renderItem={renderReply}
          />
        )}

        {/* Input */}
        <View className="flex-row items-center px-4 py-2.5 border-t border-border pb-[30px] gap-2.5" style={{ borderTopWidth: 0.5 }}>
          <MentionTextInput
            inputRef={inputRef}
            className="flex-1 bg-surface rounded-[20px] px-4 py-2.5 text-sm text-text max-h-[80px]"
            placeholder="Répondre..."
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
