import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, Image, ActivityIndicator,
  Alert, FlatList, Dimensions, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@garona/shared";
import { postsApi } from "../../lib/api";
import { API_URL, useAuth } from "../../lib/auth";

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
      await postsApi.create(imageUrls, caption || undefined);
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
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.lockedIcon}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.lockedTitle}>Palier 2 requis</Text>
        <Text style={styles.lockedDesc}>
          Tu dois être au moins Habitant (3 parrainages) pour publier des photos.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { setSelected([]); setCaption(""); setShowCaption(false); }}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Nouvelle publication</Text>
        <Pressable
          onPress={showCaption ? handlePost : () => setShowCaption(true)}
          disabled={selected.length === 0 || uploading}
          style={{ opacity: selected.length === 0 || uploading ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.nextText}>{showCaption ? "Partager" : "Suivant"}</Text>
          )}
        </Pressable>
      </View>

      {showCaption ? (
        /* Caption step */
        <ScrollView contentContainerStyle={styles.captionStep}>
          <View style={styles.captionRow}>
            {selected.length > 0 && (
              <Image source={{ uri: selected[0] }} style={styles.captionThumb} />
            )}
            <TextInput
              style={styles.captionInput}
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
            <ScrollView horizontal style={styles.captionPreviewRow} showsHorizontalScrollIndicator={false}>
              {selected.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.captionPreviewThumb} />
              ))}
            </ScrollView>
          )}
        </ScrollView>
      ) : (
        /* Gallery picker step */
        <>
          {/* Preview */}
          <View style={styles.preview}>
            {selected.length > 0 ? (
              <>
                <Image source={{ uri: selected[previewIndex] || selected[0] }} style={styles.previewImage} resizeMode="cover" />
                {selected.length > 1 && (
                  <View style={styles.previewCounter}>
                    <Text style={styles.previewCounterText}>{previewIndex + 1}/{selected.length}</Text>
                  </View>
                )}
                {/* Swipe through selected */}
                {selected.length > 1 && (
                  <View style={styles.previewNav}>
                    {previewIndex > 0 && (
                      <Pressable style={styles.previewNavBtn} onPress={() => setPreviewIndex(previewIndex - 1)}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                      </Pressable>
                    )}
                    <View style={{ flex: 1 }} />
                    {previewIndex < selected.length - 1 && (
                      <Pressable style={styles.previewNavBtn} onPress={() => setPreviewIndex(previewIndex + 1)}>
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.previewImage, styles.previewEmpty]}>
                <Ionicons name="images-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>Sélectionne des photos</Text>
              </View>
            )}
          </View>

          {/* Gallery header */}
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>
              Galerie{selected.length > 0 ? ` (${selected.length})` : ""}
            </Text>
            <View style={styles.galleryActions}>
              <Pressable style={styles.multiBtn}>
                <Ionicons name="copy-outline" size={18} color={colors.primary} />
                <Text style={styles.multiBtnText}>Multi</Text>
              </Pressable>
              <Pressable style={styles.cameraBtn} onPress={takePhoto}>
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
                  <Image source={{ uri: item.uri }} style={styles.galleryTile} />
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{idx + 1}</Text>
                    </View>
                  )}
                  {isSelected && <View style={styles.selectedOverlay} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.center}>
                <Text style={{ color: colors.textMuted }}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  nextText: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  // Preview
  preview: { width: SCREEN_W, height: SCREEN_W * 0.6, backgroundColor: "#000" },
  previewImage: { width: "100%", height: "100%" },
  previewEmpty: { justifyContent: "center", alignItems: "center", backgroundColor: colors.surface },
  previewCounter: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  previewCounterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  previewNav: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8,
  },
  previewNavBtn: {
    backgroundColor: "rgba(0,0,0,0.4)", width: 32, height: 32, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
  },
  // Gallery header
  galleryHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  galleryTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  galleryActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  multiBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.surface, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  multiBtnText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  cameraBtn: {
    backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
  },
  // Gallery grid
  galleryTile: { width: GALLERY_TILE, height: GALLERY_TILE },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(233,30,99,0.2)",
  },
  selectedBadge: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: colors.primary, width: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  selectedBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  // Caption step
  captionStep: { padding: 16, gap: 16 },
  captionRow: { flexDirection: "row", gap: 12 },
  captionThumb: { width: 64, height: 64, borderRadius: 8 },
  captionInput: {
    flex: 1, color: colors.text, fontSize: 15, lineHeight: 22,
    textAlignVertical: "top", minHeight: 80,
  },
  captionPreviewRow: { marginTop: 8 },
  captionPreviewThumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  // Locked
  lockedIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  lockedTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  lockedDesc: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22, marginTop: 8 },
});
