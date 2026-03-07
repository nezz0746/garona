import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress?: () => void;
};

export function IconButton({ name, size = 24, color = colors.text, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="p-1">
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
