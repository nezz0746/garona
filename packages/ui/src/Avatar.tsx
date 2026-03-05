import { Image, StyleSheet, View } from "react-native";
import { colors } from "@ig/shared";

type Props = {
  uri: string;
  size?: number;
  ring?: boolean;
  seen?: boolean;
};

export function Avatar({ uri, size = 32, ring = false, seen = false }: Props) {
  const outer = size + 8;
  return ring ? (
    <View
      style={[
        styles.ring,
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          borderColor: seen ? colors.border : "#e1306c",
        },
      ]}
    >
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    </View>
  ) : (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
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
