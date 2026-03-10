import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";
import { Avatar } from "@garona/ui";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { useAuth } from "../../lib/auth";

type TabIcon = { color: string; focused: boolean };

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }: TabIcon) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, focused }: TabIcon) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color }: TabIcon) => (
            <Ionicons name="add-circle-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="guide" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }: TabIcon) =>
            user?.avatarUrl ? (
              <View
                style={{
                  borderWidth: 2,
                  borderColor: focused ? colors.accent : "transparent",
                  borderRadius: 999,
                }}
              >
                <Avatar uri={user.avatarUrl} name={user.name} size={26} />
              </View>
            ) : (
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={28}
                color={focused ? colors.accent : colors.textMuted}
              />
            ),
        }}
      />
    </Tabs>
  );
}
