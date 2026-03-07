import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { BrandText } from "./BrandText";

const { width } = Dimensions.get("window");

type Slide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "water-outline",
    title: "Garona",
    subtitle: "Le réseau de Toulouse",
    description:
      "Un réseau social local, fait par et pour les Toulousains. Pas d'algorithme, pas de pub. Juste ta ville.",
  },
  {
    id: "2",
    icon: "people-outline",
    title: "Ici, on se connaît",
    subtitle: "Système de confiance par parrainage",
    description:
      "Pour rejoindre Garona, quelqu'un doit te parrainer. Chaque parrainage est un gage de confiance. Plus on te fait confiance, plus tu peux faire.",
  },
  {
    id: "3",
    icon: "shield-checkmark-outline",
    title: "Les rangs",
    subtitle: "Débloque des actions avec la confiance",
    description:
      "👀 Rang 0 — Visiteur\n🏠 Rang 1 — Membre\n📸 Rang 2 — Contributeur\n💬 Rang 3 — Résident\n⭐ Rang 4 — Notable\n🏛 Rang 5 — Gardien",
  },
  {
    id: "4",
    icon: "qr-code-outline",
    title: "Prêt ?",
    subtitle: "Fais-toi parrainer pour débloquer plus",
    description:
      "Demande à un ami toulousain de te parrainer via ton QR code ou ton profil. C'est tout ce qu'il faut.",
  },
];

type Props = {
  onFinish: () => void;
  onSignIn: () => void;
  signingIn?: boolean;
};

export function OnboardingCarousel({ onFinish, onSignIn, signingIn }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const goNext = () => {
    if (activeIndex === SLIDES.length - 1) {
      onFinish();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            className="flex-1 justify-center items-center px-10"
            style={{ width }}
          >
            <View className="w-[120px] h-[120px] rounded-full bg-primary-light justify-center items-center mb-8">
              <Ionicons name={item.icon} size={64} color={colors.primary} />
            </View>
            {item.title === "Garona" ? (
              <BrandText className="text-[32px] text-text mb-2 text-center">
                {item.title}
              </BrandText>
            ) : (
              <Text className="text-[32px] font-extrabold text-text mb-2 text-center">
                {item.title}
              </Text>
            )}
            <Text className="text-base font-semibold text-primary mb-5 text-center">
              {item.subtitle}
            </Text>
            <Text className="text-[15px] text-text-secondary text-center leading-6">
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.id}
            className={`w-2 h-2 rounded-full bg-border ${i === activeIndex ? "bg-primary w-6" : ""}`}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View className="px-6 pb-12">
        {activeIndex < SLIDES.length - 1 ? (
          <>
            <Pressable onPress={onFinish}>
              <Text className="text-text-muted text-base">Passer</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl"
              onPress={goNext}
            >
              <Text className="text-white text-base font-semibold">
                Suivant
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </>
        ) : (
          <View className="gap-3">
            <Pressable
              className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl justify-center"
              onPress={onFinish}
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">
                Créer mon compte
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center justify-center gap-2 bg-surface border border-border py-3.5 rounded-xl"
              onPress={onSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="finger-print-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text className="text-primary text-base font-semibold">
                    J'ai déjà un compte
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
