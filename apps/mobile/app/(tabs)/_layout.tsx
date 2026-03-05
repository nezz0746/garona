import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@ig/shared";

type TabIcon = { color: string; focused: boolean };

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, borderTopWidth: 0.5, height: 50, paddingBottom: 4 },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, focused }: TabIcon) => <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: ({ color, focused }: TabIcon) => <Ionicons name={focused ? "search" : "search-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="create" options={{ tabBarIcon: ({ color }: TabIcon) => <Ionicons name="add-circle-outline" size={28} color={color} /> }} />
      <Tabs.Screen name="activity" options={{ tabBarIcon: ({ color, focused }: TabIcon) => <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, focused }: TabIcon) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={28} color={color} /> }} />
    </Tabs>
  );
}
