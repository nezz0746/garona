import { useState, useRef } from "react";
import {
  View, Text, Modal, Pressable, FlatList,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useCommentsQuery } from "../hooks/queries/useCommentsQuery";
import { useCommentMutation } from "../hooks/mutations/useCommentMutation";
import { MentionTextInput } from "./MentionTextInput";
import { RichText } from "./RichText";

type Props = {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
};

export function CommentsSheet({ postId, visible, onClose }: Props) {
  const { data: comments = [], isLoading } = useCommentsQuery(visible ? postId : null);
  const commentMutation = useCommentMutation(postId || "");
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (!text.trim() || !postId || commentMutation.isPending) return;
    commentMutation.mutate(text.trim(), {
      onSuccess: () => setText(""),
    });
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="items-center py-3 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
          <View className="w-10 h-1 rounded-sm bg-border mb-2" />
          <Text className="text-base font-bold text-text">Commentaires</Text>
          <Pressable onPress={onClose} className="absolute right-4 top-4">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Comments list */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center gap-2">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : comments.length === 0 ? (
          <View className="flex-1 justify-center items-center gap-2">
            <Text className="text-base font-semibold text-text">Aucun commentaire</Text>
            <Text className="text-sm text-text-muted">Sois le premier à commenter !</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerClassName="p-4 gap-4"
            renderItem={({ item }) => (
              <View className="flex-row gap-2.5">
                <Avatar uri={(item as any).author?.avatarUrl} name={(item as any).author?.username} size={32} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-text text-sm leading-5">
                    <Text className="font-semibold">
                      {(item as any).author?.username || "utilisateur"}
                    </Text>{" "}
                  </Text>
                  <RichText className="text-text text-sm leading-5">
                    {item.text}
                  </RichText>
                  <Text className="text-text-muted text-[11px]">{timeAgo(item.createdAt)}</Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Input */}
        <View className="flex-row items-center px-4 py-2.5 border-t border-border pb-[30px] gap-2.5" style={{ borderTopWidth: 0.5 }}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
