import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@ig/shared";

export default function CreateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>New Post</Text>
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text style={styles.sub}>Take a photo or choose from gallery</Text>
        <View style={styles.row}>
          {(["camera", "images", "videocam"] as const).map((icon) => (
            <Pressable key={icon} style={styles.option}>
              <Ionicons name={icon} size={24} color={colors.text} />
              <Text style={styles.optLabel}>{icon === "videocam" ? "Reel" : icon === "images" ? "Gallery" : "Camera"}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  sub: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: "row", gap: 32, marginTop: 16 },
  option: { alignItems: "center", gap: 6 },
  optLabel: { color: colors.text, fontSize: 12 },
});
