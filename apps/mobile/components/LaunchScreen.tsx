import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

type Props = {
  onSignUp: () => void;
  onSignIn: () => void;
};

export function LaunchScreen({ onSignUp, onSignIn }: Props) {
  return (
    <View className="flex-1 bg-bg justify-between pb-[60px] pt-[120px]">
      <View className="items-center gap-3">
        <View className="w-[100px] h-[100px] rounded-full bg-primary-light justify-center items-center mb-2">
          <Ionicons name="water-outline" size={56} color={colors.primary} />
        </View>
        <Text className="text-[42px] font-black text-primary tracking-tight">Garona</Text>
        <Text className="text-base text-text-muted font-medium">Le réseau de Toulouse</Text>
      </View>

      <View className="px-8 gap-3">
        <Pressable className="bg-primary rounded-[14px] py-4 items-center" onPress={onSignUp}>
          <Text className="text-white text-[17px] font-bold">Créer un compte</Text>
        </Pressable>

        <Pressable className="rounded-[14px] py-4 items-center border-[1.5px] border-primary" onPress={onSignIn}>
          <Text className="text-primary text-[17px] font-bold">J'ai déjà un compte</Text>
        </Pressable>
      </View>
    </View>
  );
}
