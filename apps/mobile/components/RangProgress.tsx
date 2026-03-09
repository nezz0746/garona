import { useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

const RANKS = [
  {
    level: 0,
    label: "Visiteur",
    emoji: "👀",
    color: "#94a3b8",
    bg: "#f1f5f9",
    vouches: 0,
    permissions: ["Voir le feed", "Créer un profil"],
  },
  {
    level: 1,
    label: "Membre",
    emoji: "🏠",
    color: "#475569",
    bg: "#e2e8f0",
    vouches: 2,
    permissions: ["Liker", "Suivre", "Parrainer"],
  },
  {
    level: 2,
    label: "Contributeur",
    emoji: "📸",
    color: "#0f172a",
    bg: "#cbd5e1",
    vouches: 5,
    permissions: ["Publier", "Commenter"],
  },
] as const;

const ARROW_W = 10;
const BAR_H = 40;

type Props = {
  rang: number;
  totalWeight: number;
};

export function RangProgress({ rang, totalWeight }: Props) {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const nextRank = RANKS[rang + 1];
  const currentRank = RANKS[rang] || RANKS[0];
  const nextThreshold = nextRank?.vouches ?? currentRank.vouches;
  const remaining = Math.max(nextThreshold - totalWeight, 0);

  const toggle = () => {
    const toExpanded = !expanded;
    setExpanded(toExpanded);
    if (toExpanded) {
      Animated.parallel([
        Animated.spring(animHeight, {
          toValue: 1,
          useNativeDriver: false,
          damping: 18,
          stiffness: 160,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  return (
    <View className="mt-3">
      <Pressable onPress={toggle}>
        <View className="flex-row" style={{ height: BAR_H }}>
          {RANKS.map((rank, i) => {
            const unlocked = rang >= rank.level;
            const isCurrent = rang === rank.level;
            const isLast = i === RANKS.length - 1;
            const segmentOpacity = unlocked ? 1 : 0.4;
            const bgColor = unlocked ? rank.bg : "#f1f5f9";
            const textColor = unlocked ? rank.color : colors.textMuted;
            const nextBg = isLast
              ? "transparent"
              : rang >= RANKS[i + 1].level
                ? RANKS[i + 1].bg
                : "#f1f5f9";

            return (
              <View
                key={rank.level}
                className="flex-1 flex-row"
                style={{ zIndex: RANKS.length - i, opacity: segmentOpacity }}
              >
                <View
                  className="flex-1 flex-row items-center justify-center"
                  style={{
                    backgroundColor: bgColor,
                    paddingLeft: i === 0 ? 12 : ARROW_W + 4,
                    paddingRight: 4,
                    borderWidth: isCurrent ? 1.5 : 0,
                    borderColor: isCurrent ? rank.color : "transparent",
                    borderRightWidth: 0,
                    borderTopLeftRadius: i === 0 ? 8 : 0,
                    borderBottomLeftRadius: i === 0 ? 8 : 0,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>{rank.emoji}</Text>
                  <Text
                    className="font-semibold ml-1"
                    style={{ fontSize: 11, color: textColor }}
                    numberOfLines={1}
                  >
                    {rank.label}
                  </Text>
                </View>

                <View
                  style={{
                    width: ARROW_W,
                    height: BAR_H,
                    backgroundColor: isLast ? "transparent" : nextBg,
                  }}
                >
                  <Svg
                    width={ARROW_W}
                    height={BAR_H}
                    viewBox={`0 0 ${ARROW_W} ${BAR_H}`}
                  >
                    <Polygon
                      points={`0,0 ${ARROW_W},${BAR_H / 2} 0,${BAR_H}`}
                      fill={bgColor}
                    />
                    {isCurrent && (
                      <Polygon
                        points={`0,0 ${ARROW_W},${BAR_H / 2} 0,${BAR_H}`}
                        fill="none"
                        stroke={rank.color}
                        strokeWidth={1.5}
                      />
                    )}
                  </Svg>
                </View>
              </View>
            );
          })}
        </View>
      </Pressable>

      <Animated.View
        style={{
          maxHeight: animHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300],
          }),
          opacity: animOpacity,
          overflow: "hidden",
        }}
      >
        <View className="flex-row pt-2 pb-1">
          {RANKS.map((rank) => {
            const unlocked = rang >= rank.level;
            const segmentOpacity = unlocked ? 1 : 0.35;
            return (
              <View
                key={rank.level}
                className="flex-1 items-center px-1"
                style={{ opacity: segmentOpacity }}
              >
                {unlocked ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={rank.color}
                  />
                ) : (
                  <Ionicons
                    name="lock-closed-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                )}
                {rank.permissions.map((perm) => (
                  <Text
                    key={perm}
                    className="text-center mt-0.5"
                    style={{
                      fontSize: 10,
                      color: unlocked ? colors.textSecondary : colors.textMuted,
                      lineHeight: 13,
                    }}
                  >
                    {perm}
                  </Text>
                ))}
                {!unlocked && rank.vouches > 0 && (
                  <Text
                    className="text-center mt-1 font-semibold"
                    style={{ fontSize: 9, color: rank.color }}
                  >
                    {rank.vouches} pts
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {nextRank && (
          <View
            className="flex-row items-center justify-center gap-1.5 pt-2 pb-2 mx-4"
            style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={14}
              color={nextRank.color}
            />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Encore {remaining} pt{remaining > 1 ? "s" : ""} pour{" "}
              <Text style={{ color: nextRank.color, fontWeight: "600" }}>
                {nextRank.label}
              </Text>
            </Text>
          </View>
        )}

        {!nextRank && (
          <View
            className="flex-row items-center justify-center gap-1.5 pt-2 pb-2 mx-4"
            style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}
          >
            <Ionicons name="star" size={14} color={currentRank.color} />
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              Tout est débloqué
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
