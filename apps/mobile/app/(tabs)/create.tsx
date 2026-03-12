import { useState, useEffect } from "react";
import {
  View, Text, Pressable, Image, ActivityIndicator,
  Alert, FlatList, Dimensions, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { colors } from "@garona/shared";
import { API_URL, useAuth } from "../../lib/auth";
import { useCreatePostMutation } from "../../hooks/mutations/useCreatePostMutation";
import { useToast } from "../../components/Toast";
import { MentionTextInput } from "../../components/MentionTextInput";

const SCREEN_W = Dimensions.get("window").width;
const GALLERY_COLS = 4;
const GALLERY_GAP = 2;
const GALLERY_TILE = (SCREEN_W - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS;

type GalleryAsset = { id: string; uri: string };

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const createPostMutation = useCreatePostMutation();
  const { show: showToast } = useToast();

  const rang = user?.rang ?? 0;
  const canPost = rang >= 2;
  const canSubmit = caption.trim().length > 0 || selected.length > 0;

  // Load gallery when expanded
  useEffect(() => {
    if (!showGallery) return;
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      setHasPermission(true);
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      const assets = await Promise.all(
        media.assets.map(async (a) => {
          const info = await MediaLibrary.getAssetInfoAsync(a);
          return { id: a.id, uri: info.localUri || a.uri };
        })
      );
      setGallery(assets);
    })();
  }, [showGallery]);

  const toggleSelect = (uri: string) => {
    setSelected((prev) => {
      if (prev.includes(uri)) return prev.filter((u) => u !== uri);
      if (prev.length >= 10) return prev;
      return [...prev, uri];
    });
  };

  const removeImage = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setSelected((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10 - selected.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelected((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 10));
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  };

  const uploadImage = async (uri: string): Promise<string> => {
    // Compress before upload: resize to 1200px wide, 70% JPEG quality
    const compressedUri = await compressImage(uri);
    const filename = `photo-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", { uri: compressedUri, name: filename, type: "image/jpeg" } as any);
    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST", body: formData,
      headers: { ...((__DEV__ && user?.username) ? { "X-Dev-User": user.username } : {}) },
    });
    if (!res.ok) throw new Error("Upload échoué");
    return (await res.json()).url;
  };

  const handlePost = async () => {
    if (!canSubmit) return;
    setUploading(true);
    try {
      const imageUrls = selected.length > 0 ? await Promise.all(selected.map(uploadImage)) : [];
      await createPostMutation.mutateAsync({ imageUrls, caption: caption || undefined });
      setSelected([]);
      setCaption("");
      setShowGallery(false);
      showToast({ message: "Publié !", type: "success" });
      router.navigate("/(tabs)/profile");
    } catch (e: any) {
      showToast({ message: e.message || "Impossible de publier", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  if (!canPost) {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-8" style={{ paddingTop: insets.top }}>
        <View className="w-[100px] h-[100px] rounded-full bg-surface justify-center items-center mb-5">
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        </View>
        <Text className="text-xl font-bold text-text">Rang 2 requis</Text>
        <Text className="text-sm text-text-muted text-center leading-[22px] mt-2.5">
          Tu dois être au moins rang 2 pour publier.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2.5 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => { setSelected([]); setCaption(""); setShowGallery(false); router.navigate("/(tabs)"); }}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Publier</Text>
        <Pressable
          onPress={handlePost}
          disabled={!canSubmit || uploading}
          style={{ opacity: !canSubmit || uploading ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">Publier</Text>
          )}
        </Pressable>
      </View>

      {/* Compose area */}
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="flex-row px-4 pt-3 gap-3">
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-surface overflow-hidden">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full justify-center items-center">
                <Ionicons name="person" size={20} color={colors.textMuted} />
              </View>
            )}
          </View>

          {/* Text input */}
          <View className="flex-1 pb-3">
            <MentionTextInput
              className="text-text text-[16px] leading-[24px] min-h-[100px]"
              style={{ textAlignVertical: "top" }}
              placeholder="Quoi de neuf ?"
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              autoFocus
            />
          </View>
        </View>

        {/* Image previews */}
        {selected.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-4">
            {selected.map((uri, i) => (
              <View key={uri} className="mr-2.5 relative">
                <Image source={{ uri }} className="w-[100px] h-[100px] rounded-xl" resizeMode="cover" />
                <Pressable
                  className="absolute -top-1.5 -right-1.5 bg-black/70 w-5 h-5 rounded-full justify-center items-center"
                  onPress={() => removeImage(i)}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom toolbar */}
      <View className="border-t border-border" style={{ borderTopWidth: 0.5 }}>
        <View className="flex-row items-center px-4 py-3 gap-5">
          <Pressable onPress={pickFromLibrary} disabled={selected.length >= 10}>
            <Ionicons name="image-outline" size={24} color={selected.length >= 10 ? colors.textMuted : colors.primary} />
          </Pressable>
          <Pressable onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setShowGallery(!showGallery)}>
            <Ionicons name={showGallery ? "chevron-down" : "grid-outline"} size={22} color={colors.primary} />
          </Pressable>
          <View className="flex-1" />
          <Text className="text-text-muted text-xs">{caption.length}/500</Text>
        </View>

        {/* Inline gallery */}
        {showGallery && (
          <FlatList
            data={gallery}
            keyExtractor={(a) => a.id}
            numColumns={GALLERY_COLS}
            columnWrapperStyle={{ gap: GALLERY_GAP }}
            contentContainerStyle={{ gap: GALLERY_GAP }}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => {
              const idx = selected.indexOf(item.uri);
              const isSelected = idx !== -1;
              return (
                <Pressable onPress={() => toggleSelect(item.uri)}>
                  <Image source={{ uri: item.uri }} style={{ width: GALLERY_TILE, height: GALLERY_TILE }} />
                  {isSelected && (
                    <View className="absolute top-1.5 right-1.5 bg-primary w-[22px] h-[22px] rounded-full justify-center items-center border-2 border-white">
                      <Text className="text-white text-[11px] font-bold">{idx + 1}</Text>
                    </View>
                  )}
                  {isSelected && <View className="absolute inset-0 bg-[rgba(233,30,99,0.2)]" />}
                </Pressable>
              );
            }}
            ListEmptyComponent={() => (
              <View className="justify-center items-center p-8">
                <Text className="text-text-muted">
                  {hasPermission ? "Aucune photo" : "Autorisation galerie requise"}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
