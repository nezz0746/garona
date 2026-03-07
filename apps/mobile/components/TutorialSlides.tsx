import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, Dimensions, Pressable,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "people-outline" as const,
    title: "Bienvenue, Membre !",
    subtitle: "Tu es Rang 1",
    description: "Tu peux voir le fil, suivre des gens et liker. Pour poster et commenter, il te faudra des parrainages.",
  },
  {
    id: "2",
    icon: "shield-checkmark-outline" as const,
    title: "Les rangs",
    subtitle: "Monte en confiance",
    description: "🏠 Rang 1 — Suivre, liker\n📸 Rang 2 — Poster, commenter\n💬 Rang 3 — Messages privés\n⭐ Rang 4 — Inviter, organiser\n🏛 Rang 5 — Modérer",
  },
  {
    id: "3",
    icon: "qr-code-outline" as const,
    title: "Parrainages",
    subtitle: "Demande à tes contacts de te parrainer",
    description: "Partage ton profil ou ton QR code. Quand quelqu'un te parraine, tu gagnes de la confiance et tu montes en rang.",
  },
];

type Props = {
  userName: string;
  onFinish: () => void;
};

export function TutorialSlides({ userName, onFinish }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={56} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.bottom}>
        {isLast ? (
          <Pressable style={styles.startBtn} onPress={onFinish}>
            <Text style={styles.startText}>C'est parti !</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={onFinish}>
              <Text style={styles.skipText}>Passer</Text>
            </Pressable>
            <Pressable
              style={styles.nextBtn}
              onPress={() => flatListRef.current?.scrollToOffset({ offset: (activeIndex + 1) * width, animated: true })}
            >
              <Text style={styles.nextText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  slide: {
    width, flex: 1,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: 28,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, fontWeight: "600", color: colors.primary, marginBottom: 20, textAlign: "center" },
  description: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  bottom: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, paddingBottom: 48,
  },
  skipText: { color: colors.textMuted, fontSize: 16 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  startBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: "center",
  },
  startText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
