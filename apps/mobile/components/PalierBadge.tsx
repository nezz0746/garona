import { View, Text } from "react-native";
import { colors } from "@garona/shared";

const RANG_CONFIG = [
  { emoji: "👀", label: "Visiteur", color: "#9ca3af" },
  { emoji: "🏠", label: "Membre", color: "#60a5fa" },
  { emoji: "📸", label: "Contributeur", color: "#34d399" },
  { emoji: "💬", label: "Résident", color: "#a78bfa" },
  { emoji: "⭐", label: "Notable", color: "#fbbf24" },
  { emoji: "🏛", label: "Gardien", color: colors.primary },
];

const sizeClasses = {
  sm: { badge: "px-2 py-0.5", emoji: "text-[10px]", label: "text-[10px]" },
  md: { badge: "px-2.5 py-1", emoji: "text-[13px]", label: "text-[12px]" },
  lg: { badge: "px-3.5 py-1.5", emoji: "text-[16px]", label: "text-[14px]" },
};

type Props = {
  palier: number;
  size?: "sm" | "md" | "lg";
};

export function PalierBadge({ palier, size = "md" }: Props) {
  const config = RANG_CONFIG[palier] || RANG_CONFIG[0];
  const sc = sizeClasses[size];

  return (
    <View className={`flex-row items-center gap-1 border rounded-[20px] ${sc.badge}`} style={{ borderColor: config.color }}>
      <Text className={sc.emoji}>{config.emoji}</Text>
      <Text className={`font-semibold ${sc.label}`} style={{ color: config.color }}>
        Rang {palier} — {config.label}
      </Text>
    </View>
  );
}
