import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { API_URL } from "../lib/auth";

type Props = {
  code: string;
  onAccept: (code: string) => void;
  onBack: () => void;
};

type InviteInfo = {
  valid: boolean;
  creator: { name: string; username: string; avatarUrl: string } | null;
  expiresAt: string;
  error?: string;
};

export function InviteValidator({ code, onAccept, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/vouches/invite/${code}`)
      .then((r) => r.json())
      .then((data) => {
        setInvite(data);
        setLoading(false);
      })
      .catch(() => {
        setInvite({ valid: false, creator: null, expiresAt: "", error: "Network error" });
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-8 gap-4">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-text-secondary text-[15px] mt-4">Vérification de l'invitation...</Text>
      </View>
    );
  }

  if (!invite?.valid) {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-8 gap-4">
        <View className="w-[100px] h-[100px] rounded-full bg-[#fef2f2] justify-center items-center mb-2">
          <Ionicons name="close-circle-outline" size={64} color="#ef4444" />
        </View>
        <Text className="text-[26px] font-extrabold text-text">Invitation invalide</Text>
        <Text className="text-sm text-text-secondary text-center leading-[22px] px-2">
          {invite?.error === "Already used" && "Cette invitation a déjà été utilisée."}
          {invite?.error === "Expired" && "Cette invitation a expiré."}
          {invite?.error === "Invalid code" && "Ce code d'invitation n'existe pas."}
          {!invite?.error && "Impossible de vérifier cette invitation."}
        </Text>
        <Pressable className="px-8 py-3.5 rounded-xl border border-border mt-2" onPress={onBack}>
          <Text className="text-text text-base font-semibold">Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg justify-center items-center px-8 gap-4">
      <View className="w-[100px] h-[100px] rounded-full bg-[#fef2f2] justify-center items-center mb-2" style={{ backgroundColor: colors.primaryLight }}>
        <Ionicons name="checkmark-circle-outline" size={64} color={colors.primary} />
      </View>

      <Text className="text-[26px] font-extrabold text-text">Tu es invité !</Text>

      {invite.creator && (
        <View className="flex-row items-center gap-3 bg-card border border-border rounded-xl p-4 w-full">
          <Image source={{ uri: invite.creator.avatarUrl }} className="w-12 h-12 rounded-full" />
          <View>
            <Text className="text-base font-semibold text-text">{invite.creator.name}</Text>
            <Text className="text-[13px] text-text-muted mt-0.5">@{invite.creator.username} t'invite sur Garona</Text>
          </View>
        </View>
      )}

      <Text className="text-sm text-text-secondary text-center leading-[22px] px-2">
        En rejoignant, tu commences en tant qu'Observateur. Demande à tes connaissances de te parrainer pour débloquer plus de fonctionnalités.
      </Text>

      <Pressable className="flex-row items-center gap-2 bg-primary px-8 py-4 rounded-xl mt-2 w-full justify-center" onPress={() => onAccept(code)}>
        <Ionicons name="log-in-outline" size={20} color="#fff" />
        <Text className="text-white text-[17px] font-semibold">Rejoindre Garona</Text>
      </Pressable>

      <Pressable onPress={onBack}>
        <Text className="text-text-muted text-[15px] mt-1">Annuler</Text>
      </Pressable>
    </View>
  );
}
