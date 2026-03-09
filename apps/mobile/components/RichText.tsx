import { Text, type TextProps } from "react-native";
import { router } from "expo-router";
import { colors } from "@garona/shared";

type Props = TextProps & {
  children: string;
};

export function RichText({ children: text, ...rest }: Props) {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const username = match[1];
    parts.push(
      <Text
        key={`${match.index}-${username}`}
        style={{ fontWeight: "600", color: colors.accent }}
        onPress={() => router.push(`/user/${username}`)}
      >
        @{username}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <Text {...rest}>{parts}</Text>;
}
