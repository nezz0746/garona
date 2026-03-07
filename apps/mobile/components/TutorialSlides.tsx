import { useState, useRef } from "react";
import {
  View, Text, FlatList, Dimensions, Pressable,
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
    <View className="flex-1 bg-bg">
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
          <View className="flex-1 justify-center items-center px-10" style={{ width }}>
            <View className="w-[110px] h-[110px] rounded-full bg-primary-light justify-center items-center mb-7">
              <Ionicons name={item.icon} size={56} color={colors.primary} />
            </View>
            <Text className="text-[28px] font-extrabold text-text mb-2 text-center">{item.title}</Text>
            <Text className="text-base font-semibold text-primary mb-5 text-center">{item.subtitle}</Text>
            <Text className="text-[15px] text-text-secondary text-center leading-6">{item.description}</Text>
          </View>
        )}
      />

      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <View key={i} className={`w-2 h-2 rounded-full bg-border ${i === activeIndex ? "bg-primary w-6" : ""}`} />
        ))}
      </View>

      <View className="flex-row justify-between items-center px-6 pb-12">
        {isLast ? (
          <Pressable className="flex-1 bg-primary rounded-xl py-4 items-center" onPress={onFinish}>
            <Text className="text-white text-[17px] font-bold">C'est parti !</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={onFinish}>
              <Text className="text-text-muted text-base">Passer</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl"
              onPress={() => flatListRef.current?.scrollToOffset({ offset: (activeIndex + 1) * width, animated: true })}
            >
              <Text className="text-white text-base font-semibold">Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

