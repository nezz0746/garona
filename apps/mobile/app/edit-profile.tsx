import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { useAuth, API_URL } from "../lib/auth";
import { useUpdateProfileMutation } from "../hooks/mutations/useUpdateProfileMutation";
import { useProfileQuery } from "../hooks/queries/useProfileQuery";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { data: profile } = useProfileQuery(user?.username || "");
  const updateMutation = useUpdateProfileMutation(user?.username || "");

  const [name, setName] = useState(profile?.name || user?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentAvatar = avatarUri || profile?.avatarUrl || user?.avatarUrl || null;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string> => {
    const filename = uri.split("/").pop() || "avatar.jpg";
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
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(avatarUri);
      }
      const result = await updateMutation.mutateAsync({
        name: name.trim() || undefined,
        bio: bio.trim(),
        avatarUrl,
      });
      updateUser({
        name: result.name,
        avatarUrl: result.avatarUrl,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de sauvegarder");
    } finally {
      setUploading(false);
    }
  };

  const hasChanges = name !== (profile?.name || user?.name || "")
    || bio !== (profile?.bio || "")
    || avatarUri !== null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-border" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()}>
          <Text className="text-text text-base">Annuler</Text>
        </Pressable>
        <Text className="text-lg font-bold text-text">Modifier le profil</Text>
        <Pressable
          onPress={handleSave}
          disabled={uploading || !hasChanges}
          style={{ opacity: uploading || !hasChanges ? 0.4 : 1 }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text className="text-primary font-bold text-base">OK</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="items-center py-6 px-4 gap-6">
        <Pressable onPress={pickAvatar} className="items-center">
          <View className="relative">
            <Avatar uri={currentAvatar} name={name} size={96} />
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full justify-center items-center border-2 border-bg">
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
          <Text className="text-primary text-sm font-semibold mt-2">Changer la photo</Text>
        </Pressable>

        <View className="w-full">
          <Text className="text-text-muted text-xs mb-1">Nom</Text>
          <TextInput
            className="text-text text-base border-b border-border pb-2"
            value={name}
            onChangeText={setName}
            placeholder="Ton nom"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View className="w-full">
          <Text className="text-text-muted text-xs mb-1">Bio</Text>
          <TextInput
            className="text-text text-base border-b border-border pb-2"
            value={bio}
            onChangeText={setBio}
            placeholder="Décris-toi en quelques mots"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={150}
          />
        </View>
      </ScrollView>
    </View>
  );
}
