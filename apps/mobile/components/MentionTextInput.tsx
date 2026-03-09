import { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, Pressable, type TextInputProps,
  type NativeSyntheticEvent, type TextInputSelectionChangeEventData,
} from "react-native";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useSearchQuery } from "../hooks/queries/useSearchQuery";

type Props = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export function MentionTextInput({ value, onChangeText, inputRef, ...rest }: Props) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cursorPos = useRef(0);
  const mentionStart = useRef(-1);

  const { data: suggestions = [] } = useSearchQuery(mentionQuery);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);

    const pos = cursorPos.current + (text.length - value.length);
    cursorPos.current = pos;

    const textBefore = text.slice(0, pos);
    const atIndex = textBefore.lastIndexOf("@");

    if (atIndex !== -1) {
      const charBefore = atIndex > 0 ? textBefore[atIndex - 1] : " ";
      const query = textBefore.slice(atIndex + 1);
      const hasSpace = query.includes(" ");

      if ((charBefore === " " || charBefore === "\n" || atIndex === 0) && !hasSpace && query.length >= 1) {
        mentionStart.current = atIndex;
        setMentionQuery(query);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionQuery("");
  }, [value, onChangeText]);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      cursorPos.current = e.nativeEvent.selection.end;
    }, []
  );

  const handleSelectUser = useCallback((username: string) => {
    const start = mentionStart.current;
    const before = value.slice(0, start);
    const after = value.slice(cursorPos.current);
    const newText = `${before}@${username} ${after}`;
    onChangeText(newText);
    cursorPos.current = start + username.length + 2;
    setShowSuggestions(false);
    setMentionQuery("");
  }, [value, onChangeText]);

  return (
    <View className="flex-1">
      {showSuggestions && suggestions.length > 0 && (
        <View
          className="bg-bg border border-border rounded-xl mb-1 max-h-[180px] overflow-hidden"
          style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 4 }}
        >
          <FlatList
            data={suggestions.slice(0, 5)}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center px-3 py-2 gap-2.5"
                onPress={() => handleSelectUser(item.username)}
              >
                <Avatar uri={item.avatarUrl} name={item.name} size={32} />
                <View className="flex-1">
                  <Text className="text-text font-semibold text-[13px]">{item.name}</Text>
                  <Text className="text-text-muted text-[12px]">@{item.username}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        {...rest}
      />
    </View>
  );
}
