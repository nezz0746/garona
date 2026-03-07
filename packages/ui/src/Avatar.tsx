import { Image, StyleSheet, View, Text } from "react-native";
import { colors } from "@garona/shared";

const AVATAR_COLORS = [
  "#e91e63", // primary pink
  "#c2185b", // deep pink
  "#f06292", // light pink
  "#d81b60", // rose
  "#ad1457", // dark rose
  "#ec407a", // medium pink
  "#f48fb1", // soft pink
  "#e57373", // warm coral
  "#ef5350", // red-pink
  "#ab47bc", // purple-pink
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
  seen?: boolean;
};

export function Avatar({ uri, name, size = 32, ring = false, seen = false }: Props) {
  const outer = size + 8;

  const content = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: AVATAR_COLORS[hashCode(name || "?") % AVATAR_COLORS.length],
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.4,
          fontWeight: "700",
          lineHeight: size * 0.48,
        }}
      >
        {getInitials(name || "?")}
      </Text>
    </View>
  );

  return ring ? (
    <View
      style={[
        styles.ring,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderColor: seen ? colors.border : colors.primary,
        },
      ]}
    >
      {content}
    </View>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
