import { View, Text, Image, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { LinkPreview } from "../lib/api";

type Props = {
  preview: LinkPreview;
};

export function LinkPreviewCard({ preview }: Props) {
  const handlePress = () => {
    WebBrowser.openBrowserAsync(preview.url);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="border border-border rounded-xl overflow-hidden mt-2.5"
    >
      {preview.imageUrl && (
        <Image
          source={{ uri: preview.imageUrl }}
          className="w-full h-[160px]"
          resizeMode="cover"
        />
      )}
      <View className="px-3 py-2.5">
        {preview.domain && (
          <Text className="text-text-muted text-[11px] uppercase mb-0.5">
            {preview.domain}
          </Text>
        )}
        {preview.title && (
          <Text className="text-text font-semibold text-[14px] leading-[19px]" numberOfLines={2}>
            {preview.title}
          </Text>
        )}
        {preview.description && (
          <Text className="text-text-muted text-[13px] leading-[17px] mt-0.5" numberOfLines={2}>
            {preview.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
