import { useState } from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { vouchesApi } from "../lib/api";

type Props = {
  userId: string;
  hasVouched: boolean;
  onVouchChange?: (vouched: boolean, newPalier: number) => void;
};

export function VouchButton({ userId, hasVouched: initialVouched, onVouchChange }: Props) {
  const [vouched, setVouched] = useState(initialVouched);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (vouched) {
        const { newPalier } = await vouchesApi.revoke(userId);
        setVouched(false);
        onVouchChange?.(false, newPalier);
      } else {
        const { newPalier } = await vouchesApi.vouch(userId);
        setVouched(true);
        onVouchChange?.(true, newPalier);
      }
    } catch (e) {
      // Optimistic toggle anyway for demo
      setVouched(!vouched);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      className={`flex-row items-center gap-1.5 px-4 py-2 rounded-lg ${vouched ? "bg-primary-light border border-primary" : "bg-primary"}`}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vouched ? colors.primary : "#fff"} />
      ) : (
        <>
          <Ionicons
            name={vouched ? "shield-checkmark" : "shield-checkmark-outline"}
            size={16}
            color={vouched ? colors.primary : "#fff"}
          />
          <Text className={`font-semibold text-[13px] ${vouched ? "text-primary" : "text-white"}`}>
            {vouched ? "Parrainé" : "Parrainer"}
          </Text>
        </>
      )}
    </Pressable>
  );
}
