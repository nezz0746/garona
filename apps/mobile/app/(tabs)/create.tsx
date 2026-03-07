import { useState, useEffect } from "react";
import {
  View, Text, Pressable, TextInput, Image, ActivityIndicator,
  Alert, FlatList, Dimensions, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@garona/shared";
import { API_URL, useAuth } from "../../lib/auth";
import { useCreatePostMutation } from "../../hooks/mutations/useCreatePostMutation";

const SCREEN_W = Dimensions.get("window").width;
const GALLERY_COLS = 4;
const GALLERY_GAP = 2;
const GALLERY_TILE = (SCREEN_W - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS;

type GalleryAsset = {
  id: string;
  uri: string;
};

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryAsset[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showCaption, setShowCaption] = useState(false);
  const createPostMutation = useCreatePostMutation();

  const palier = user?.palier ?? 0;
  const canPost = palier >= 2;

  // Load gallery
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      setHasPermission(true);

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      // Get actual file URIs (ph:// doesn't work with Image component)
      const assets = await Promise.all(
        media.assets.map(async (a) => {
          const info = await MediaLibrary.getAssetInfoAsync(a);
          return { id: a.id, uri: info.localUri || a.uri };
        })
      );
      setGallery(assets);
    })();
  }, []);

  const toggleSelect = (uri: string) => {
    setSelected((prev) => {
      if (prev.includes(uri)) {
        const next = prev.filter((u) => u !== uri);
        if (previewIndex >= next.length) setPreviewIndex(Math.max(0, next.length - 1));
        return next;
      }
      return [...prev, uri];
    });
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelected((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

    const formData = new FormData();
    formData.append("file", { uri, name: filename, type } as any);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        ...((__DEV__ && user?.username) ? { "X-Dev-User": user.username } : {}),
      },
    });
    if (!res.ok) throw new Error("Upload échoué");
    const data = await res.json();
    return data.url;
  };

  const handlePost = async () => {
    if (selected.length === 0) return;
    setUploading(true);
    try {
      // Upload each image to S3/MinIO
      const imageUrls = await Promise.all(selected.map(uploadImage));
      await createPostMutation.mutateAsync({ imageUrls, caption: caption || undefined });
      setSelected([]);
      setCaption("");
      setShowCaption(false);
      Alert.alert("Publié ! 🎉", "Ta photo est maintenant visible");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de publier");
    } finally {
      setUploading(false);
    }
  };

  if (!canPost) {
    return (
      <View className="flex-1 bg-bg justify-center items-center p-8" style={{ paddingTop: insets.top }}>
        <View className="w-[100px] h-[100px] rounded-full bg-surface justify-center items-center mb-4">
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        </View>
        <Text className="text-xl font-bold text-text">Palier 2 requis</Text>
        <Text className="text-sm text-text-muted text-center leading-[22px] mt-2">
          Tu dois être au moins Habitant (3 parrainages) pour publier des photos.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => { setSelected([]); setCaption(""); setShowCaption(false); }}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-bold text-text">Nouvelle publication</Text>
        <Pressable
          onPress={showCaption ? handlePost : () => setShowCaption(true)}
          disabled={selected.length === 0 || uploading}
          style={{ opacity: selected.length === 0 || uploading ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">{showCaption ? "Partager" : "Suivant"}</Text>
          )}
        </Pressable>
      </View>

      {showCaption ? (
        /* Caption step */
        <ScrollView contentContainerClassName="p-4 gap-4">
          <View className="flex-row gap-3">
            {selected.length > 0 && (
              <Image source={{ uri: selected[0] }} className="w-16 h-16 rounded-lg" />
            )}
            <TextInput
              className="flex-1 text-text text-[15px] leading-[22px] min-h-[80px]"
              style={{ textAlignVertical: "top" }}
              placeholder="Écris une légende..."
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              autoFocus
            />
          </View>
          {selected.length > 1 && (
            <ScrollView horizontal className="mt-2" showsHorizontalScrollIndicator={false}>
              {selected.map((uri, i) => (
                <Image key={i} source={{ uri }} className="w-20 h-20 rounded-lg mr-2" />
              ))}
            </ScrollView>
          )}
        </ScrollView>
      ) : (
        /* Gallery picker step */
        <>
          {/* Preview */}
          <View style={{ width: SCREEN_W, height: SCREEN_W * 0.6, backgroundColor: "#000" }}>
            {selected.length > 0 ? (
              <>
                <Image source={{ uri: selected[previewIndex] || selected[0] }} className="w-full h-full" resizeMode="cover" />
                {selected.length > 1 && (
                  <View className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-xl">
                    <Text className="text-white text-xs font-semibold">{previewIndex + 1}/{selected.length}</Text>
                  </View>
                )}
                {/* Swipe through selected */}
                {selected.length > 1 && (
                  <View className="absolute inset-0 flex-row items-center px-2">
                    {previewIndex > 0 && (
                      <Pressable className="bg-black/40 w-8 h-8 rounded-full justify-center items-center" onPress={() => setPreviewIndex(previewIndex - 1)}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                      </Pressable>
                    )}
                    <View className="flex-1" />
                    {previewIndex < selected.length - 1 && (
                      <Pressable className="bg-black/40 w-8 h-8 rounded-full justify-center items-center" onPress={() => setPreviewIndex(previewIndex + 1)}>
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View className="w-full h-full justify-center items-center bg-surface">
                <Ionicons name="images-outline" size={48} color={colors.textMuted} />
                <Text className="text-text-muted mt-2">Sélectionne des photos</Text>
              </View>
            )}
          </View>

          {/* Gallery header */}
          <View className="flex-row justify-between items-center px-4 py-2.5">
            <Text className="text-[15px] font-semibold text-text">
              Galerie{selected.length > 0 ? ` (${selected.length})` : ""}
            </Text>
            <View className="flex-row gap-2.5 items-center">
              <Pressable className="flex-row items-center gap-1 bg-surface rounded-2xl px-3 py-1.5">
                <Ionicons name="copy-outline" size={18} color={colors.primary} />
                <Text className="text-primary font-semibold text-[13px]">Multi</Text>
              </Pressable>
              <Pressable className="bg-primary w-8 h-8 rounded-full justify-center items-center" onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Gallery grid */}
          <FlatList
            data={gallery}
            keyExtractor={(a) => a.id}
            numColumns={GALLERY_COLS}
            columnWrapperStyle={{ gap: GALLERY_GAP }}
            contentContainerStyle={{ gap: GALLERY_GAP }}
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
              <View className="flex-1 justify-center items-center p-8">
                <Text className="text-text-muted">
                  {hasPermission ? "Aucune photo trouvée" : "Autorisation requise pour accéder à la galerie"}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}
