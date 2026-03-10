import { Linking, Text, type TextProps } from "react-native";
import { router } from "expo-router";
import { colors } from "@garona/shared";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

type Props = TextProps & {
  children: string;
  /** URLs to hide from display (because a preview card is shown) */
  hideUrls?: string[];
};

export function RichText({ children: text, hideUrls, ...rest }: Props) {
  // First, strip hidden URLs from the text
  let displayText = text;
  if (hideUrls && hideUrls.length > 0) {
    for (const url of hideUrls) {
      // Remove the URL and any trailing/leading whitespace
      displayText = displayText.replace(url, "");
    }
    // Clean up extra whitespace/newlines left behind
    displayText = displayText.replace(/\n{3,}/g, "\n\n").trim();
  }

  if (!displayText) return null;

  // Tokenize: split by URLs and mentions
  const tokens: { type: "text" | "mention" | "url"; value: string; index: number }[] = [];

  // Find all URLs
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(displayText)) !== null) {
    tokens.push({ type: "url", value: match[0], index: match.index });
  }

  // Find all mentions
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(displayText)) !== null) {
    tokens.push({ type: "mention", value: match[1], index: match.index });
  }

  // Sort by position
  tokens.sort((a, b) => a.index - b.index);

  if (tokens.length === 0) {
    return <Text {...rest}>{displayText}</Text>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const token of tokens) {
    const fullMatch = token.type === "mention" ? `@${token.value}` : token.value;

    if (token.index > lastIndex) {
      parts.push(displayText.slice(lastIndex, token.index));
    }

    if (token.type === "mention") {
      parts.push(
        <Text
          key={`m-${token.index}`}
          style={{ fontWeight: "600", color: colors.accent }}
          onPress={() => router.push(`/user/${token.value}`)}
        >
          @{token.value}
        </Text>
      );
    } else {
      // Clickable URL
      parts.push(
        <Text
          key={`u-${token.index}`}
          style={{ color: colors.accent }}
          onPress={() => Linking.openURL(token.value)}
        >
          {token.value}
        </Text>
      );
    }

    lastIndex = token.index + fullMatch.length;
  }

  if (lastIndex < displayText.length) {
    parts.push(displayText.slice(lastIndex));
  }

  return <Text {...rest}>{parts}</Text>;
}
