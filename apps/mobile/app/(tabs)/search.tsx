import { useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, Image, StyleSheet, Dimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, EXPLORE_IMAGES } from "@garona/shared";
import { profilesApi } from "../../lib/api";
import { Avatar } from "@garona/ui";
import { PalierBadge } from "../../components/PalierBadge";

const GAP = 2;
const COLS = 3;
const TILE = (Math.min(Dimensions.get("window").width, 600) - GAP * (COLS - 1)) / COLS;

type SearchResult = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await profilesApi.search(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const showResults = query.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          placeholder="Chercher un Toulousain..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showResults ? (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow}>
              <Avatar uri={item.avatarUrl} name={item.name} size={48} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultUsername}>@{item.username}</Text>
                {item.bio && <Text style={styles.resultBio} numberOfLines={1}>{item.bio}</Text>}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={() =>
            !searching ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={EXPLORE_IMAGES}
          keyExtractor={(i) => i.id}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <Pressable>
              <Image source={{ uri: item.image }} style={{ width: TILE, height: TILE }} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: "600", color: colors.text },
  resultUsername: { fontSize: 13, color: colors.textMuted },
  resultBio: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  emptySearch: { padding: 40, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
