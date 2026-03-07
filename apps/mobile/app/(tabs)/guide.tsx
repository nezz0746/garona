import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { useAuth } from "../../lib/auth";

const RANGS = [
  { rang: 1, name: "Membre", emoji: "🏠", vouches: 0, perks: "Suivre des profils, liker", color: "#94a3b8" },
  { rang: 2, name: "Contributeur", emoji: "📸", vouches: 3, perks: "Publier des photos, commenter", color: "#22c55e" },
  { rang: 3, name: "Résident", emoji: "💬", vouches: 5, perks: "Messages privés, stories", color: "#3b82f6" },
  { rang: 4, name: "Notable", emoji: "⭐", vouches: 10, perks: "Inviter de nouveaux membres, organiser", color: "#f59e0b" },
  { rang: 5, name: "Gardien", emoji: "🏛", vouches: 20, perks: "Modérer le réseau, protéger la communauté", color: "#a855f7" },
];

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentRang = user?.palier ?? 1;

  return (
    <ScrollView className="flex-1 bg-bg px-5" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}>
      <Text className="text-[28px] font-extrabold text-text mb-6">Comment ça marche</Text>

      {/* Vouching section */}
      <View className="mb-7">
        <View className="w-[52px] h-[52px] rounded-full bg-surface justify-center items-center mb-2.5">
          <Ionicons name="people-outline" size={28} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-text mb-2">Le parrainage</Text>
        <Text className="text-[15px] text-text-secondary leading-[22px]">
          Garona fonctionne sur la confiance. Quand quelqu'un te parraine, il met sa réputation en jeu pour toi.{"\n\n"}
          Plus tu reçois de parrainages de personnes de confiance, plus tu montes en rang — et plus tu peux faire de choses.
        </Text>
      </View>

      {/* QR section */}
      <View className="mb-7">
        <View className="w-[52px] h-[52px] rounded-full bg-surface justify-center items-center mb-2.5">
          <Ionicons name="qr-code-outline" size={28} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-text mb-2">Scanner un QR</Text>
        <Text className="text-[15px] text-text-secondary leading-[22px]">
          Pour parrainer quelqu'un, scanne son QR code depuis son profil. C'est instantané — pas de formulaire, pas de demande à accepter.
        </Text>
      </View>

      {/* Rang ladder */}
      <View className="mb-7">
        <Text className="text-xl font-bold text-text mb-2">Les rangs</Text>
        <View className="gap-2.5">
          {RANGS.map((r) => {
            const isCurrent = r.rang === currentRang;
            const isLocked = r.rang > currentRang;
            return (
              <View
                key={r.rang}
                className="bg-surface rounded-xl p-3.5 border border-border"
                style={[
                  isCurrent && { borderColor: r.color, borderWidth: 2 },
                  isLocked && { opacity: 0.5 },
                ]}
              >
                <View className="flex-row items-center gap-2.5 mb-1">
                  <Text className="text-2xl">{r.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-text">
                      Rang {r.rang} — {r.name}
                      {isCurrent ? " (toi)" : ""}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {r.vouches === 0 ? "Inscription" : `${r.vouches} parrainages`}
                    </Text>
                  </View>
                  {isLocked && <Ionicons name="lock-closed" size={16} color={colors.textMuted} />}
                  {isCurrent && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                </View>
                <Text className="text-[13px] text-text-secondary pl-[34px]">{r.perks}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Weight explanation */}
      <View className="mb-7">
        <View className="w-[52px] h-[52px] rounded-full bg-surface justify-center items-center mb-2.5">
          <Ionicons name="scale-outline" size={28} color={colors.primary} />
        </View>
        <Text className="text-xl font-bold text-text mb-2">Poids des parrainages</Text>
        <Text className="text-[15px] text-text-secondary leading-[22px]">
          Tous les parrainages ne se valent pas. Un parrainage d'un Gardien (Rang 5) vaut bien plus qu'un parrainage d'un Membre (Rang 1).{"\n\n"}
          C'est ce qui rend le système résistant aux abus — il faut de la vraie confiance.
        </Text>
      </View>
    </ScrollView>
  );
}
