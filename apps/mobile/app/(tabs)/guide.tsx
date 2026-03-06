import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { useAuth } from "../../lib/auth";

const RANGS = [
  { rang: 1, name: "Membre", emoji: "🏠", vouches: 0, perks: "Suivre des profils, liker", color: "#94a3b8" },
  { rang: 2, name: "Contributeur", emoji: "📸", vouches: 3, perks: "Publier des photos, commenter", color: "#22c55e" },
  { rang: 3, name: "Résident", emoji: "💬", vouches: 5, perks: "Messages privés, stories", color: "#3b82f6" },
  { rang: 4, name: "Notable", emoji: "⭐", vouches: 10, perks: "Inviter de nouveaux membres, organiser", color: "#f59e0b" },
  { rang: 5, name: "Gardien", emoji: "🏛", vouches: 20, perks: "Modérer le réseau, protéger la communauté", color: "#a855f7" },
];

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentRang = user?.palier ?? 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}>
      <Text style={styles.header}>Comment ça marche</Text>

      {/* Vouching section */}
      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="people-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Le parrainage</Text>
        <Text style={styles.sectionBody}>
          Garona fonctionne sur la confiance. Quand quelqu'un te parraine, il met sa réputation en jeu pour toi.{"\n\n"}
          Plus tu reçois de parrainages de personnes de confiance, plus tu montes en rang — et plus tu peux faire de choses.
        </Text>
      </View>

      {/* QR section */}
      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="qr-code-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Scanner un QR</Text>
        <Text style={styles.sectionBody}>
          Pour parrainer quelqu'un, scanne son QR code depuis son profil. C'est instantané — pas de formulaire, pas de demande à accepter.
        </Text>
      </View>

      {/* Rang ladder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Les rangs</Text>
        <View style={styles.ladder}>
          {RANGS.map((r) => {
            const isCurrent = r.rang === currentRang;
            const isLocked = r.rang > currentRang;
            return (
              <View
                key={r.rang}
                style={[
                  styles.rangCard,
                  isCurrent && { borderColor: r.color, borderWidth: 2 },
                  isLocked && { opacity: 0.5 },
                ]}
              >
                <View style={styles.rangHeader}>
                  <Text style={styles.rangEmoji}>{r.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rangName}>
                      Rang {r.rang} — {r.name}
                      {isCurrent ? " (toi)" : ""}
                    </Text>
                    <Text style={styles.rangVouches}>
                      {r.vouches === 0 ? "Inscription" : `${r.vouches} parrainages`}
                    </Text>
                  </View>
                  {isLocked && <Ionicons name="lock-closed" size={16} color={colors.textMuted} />}
                  {isCurrent && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                </View>
                <Text style={styles.rangPerks}>{r.perks}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Weight explanation */}
      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="scale-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Poids des parrainages</Text>
        <Text style={styles.sectionBody}>
          Tous les parrainages ne se valent pas. Un parrainage d'un Gardien (Rang 5) vaut bien plus qu'un parrainage d'un Membre (Rang 1).{"\n\n"}
          C'est ce qui rend le système résistant aux abus — il faut de la vraie confiance.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
  sectionBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  ladder: { gap: 10 },
  rangCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  rangHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  rangEmoji: { fontSize: 24 },
  rangName: { fontSize: 15, fontWeight: "700", color: colors.text },
  rangVouches: { fontSize: 12, color: colors.textMuted },
  rangPerks: { fontSize: 13, color: colors.textSecondary, paddingLeft: 34 },
});
