import { ScrollView, View, Text, Pressable } from "react-native";
import { colors, Story } from "@garona/shared";
import { Avatar } from "./Avatar";
import { Ionicons } from "@expo/vector-icons";

export function StoryBar({ stories }: { stories: Story[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-2 py-2.5 gap-3">
      {/* Your story */}
      <Pressable className="items-center w-[68px]">
        <View>
          <Avatar uri={stories[0]?.user.avatar} size={56} />
          <View className="absolute -bottom-0.5 -right-0.5 bg-bg rounded-[10px] overflow-hidden">
            <Ionicons name="add-circle" size={18} color={colors.primary} />
          </View>
        </View>
        <Text className="text-text text-[11px] mt-1 text-center" numberOfLines={1}>Your story</Text>
      </Pressable>

      {stories.slice(1).map((s) => (
        <Pressable key={s.id} className="items-center w-[68px]">
          <Avatar uri={s.user.avatar} size={56} ring seen={s.seen} />
          <Text className={`text-[11px] mt-1 text-center ${s.seen ? "text-text-muted" : "text-text"}`} numberOfLines={1}>
            {s.user.username}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
