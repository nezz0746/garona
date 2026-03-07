import { useState } from "react";
import { View, Text, Pressable, Share, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { vouchesApi } from "../lib/api";

type Props = {
  palier: number;
};

export function InviteGenerator({ palier }: Props) {
  const [invite, setInvite] = useState<{ code: string; link: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canInvite = palier >= 4;

  const generateInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await vouchesApi.createInvite();
      setInvite({ code: result.code, link: result.link });
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const shareInvite = async () => {
    if (!invite) return;
    await Share.share({
      message: `Rejoins Garona, le réseau de Toulouse ! 🏛\n\nUtilise ce code : ${invite.code}\n\nOu ouvre ce lien : ${invite.link}`,
    });
  };

  if (!canInvite) {
    return (
      <View className="flex-row items-center justify-center gap-2 p-4 bg-surface rounded-xl m-4">
        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
        <Text className="text-text-muted text-[13px]">
          Palier 4 (Ambassadeur) requis pour inviter
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      {!invite ? (
        <Pressable className="flex-row items-center justify-center gap-2 bg-primary py-3.5 rounded-xl" onPress={generateInvite} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Text className="text-white text-base font-semibold">Générer une invitation</Text>
            </>
          )}
        </Pressable>
      ) : (
        <View className="bg-card border border-border rounded-xl p-4 gap-3">
          <View className="items-center gap-1">
            <Text className="text-text-muted text-xs">Code d'invitation</Text>
            <Text className="text-xl font-bold text-text tracking-wider">{invite.code}</Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary py-2.5 rounded-lg" onPress={shareInvite}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text className="text-white font-semibold text-sm">Partager</Text>
            </Pressable>
            <Pressable className="flex-row items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg border border-primary" onPress={() => { setInvite(null); generateInvite(); }}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text className="text-primary font-semibold text-sm">Nouveau</Text>
            </Pressable>
          </View>

          <Text className="text-text-muted text-xs text-center">
            Valable 7 jours • Usage unique
          </Text>
        </View>
      )}
      {error && <Text className="text-[#ef4444] text-center mt-2 text-[13px]">{error}</Text>}
    </View>
  );
}
