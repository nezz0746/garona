import { useState, useCallback, useEffect } from "react";
import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@garona/shared";
import { AuthContext, AuthUser } from "../lib/auth";
import { LaunchScreen } from "../components/LaunchScreen";
import { SignupForm } from "../components/SignupForm";
import { SigninSheet } from "../components/SigninSheet";
import { TutorialSlides } from "../components/TutorialSlides";
import { meApi, SignupResult } from "../lib/api";

type AppState = "loading" | "launch" | "signup" | "tutorial" | "authenticated";

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [user, setUser] = useState<AuthUser>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    meApi
      .get()
      .then((result) => {
        setUser({
          id: result.id,
          name: result.name,
          username: result.username,
          avatarUrl: result.avatarUrl,
          palier: result.rang,
        });
        setAppState("authenticated");
      })
      .catch(() => {
        setAppState("launch");
      });
  }, []);

  const handleSignedUp = useCallback((result: SignupResult) => {
    setUser({
      id: result.id,
      name: result.name,
      username: result.username,
      avatarUrl: result.avatarUrl,
      palier: result.rang,
    });
    setAppState("tutorial"); // Show tutorial after signup
  }, []);

  const handleSignedIn = useCallback((result: SignupResult) => {
    setUser({
      id: result.id,
      name: result.name,
      username: result.username,
      avatarUrl: result.avatarUrl,
      palier: result.rang,
    });
    setShowSignIn(false);
    setAppState("authenticated"); // Skip tutorial for returning users
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { authClient } = await import("../lib/auth-client");
      await authClient.signOut();
    } catch {}
    setUser(null);
    setInviteCode(null);
    setAppState("launch");
  }, []);

  const devSkip = useCallback(() => {
    setUser({
      id: "dev-user",
      name: "Nezz",
      username: "nezz",
      avatarUrl: null,
      palier: 4,
    });
    setAppState("authenticated");
  }, []);

  // Loading — checking session
  if (appState === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Launch screen
  if (appState === "launch") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="dark" />
        <LaunchScreen
          onSignUp={() => setAppState("signup")}
          onSignIn={() => setShowSignIn(true)}
        />
        <SigninSheet
          visible={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSignedIn={handleSignedIn}
        />
        {__DEV__ && (
          <Pressable
            onPress={devSkip}
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              backgroundColor: "#333",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12 }}>⚡ Dev</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Sign up form
  if (appState === "signup") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="dark" />
        <SignupForm
          onSignedUp={handleSignedUp}
          onBack={() => setAppState("launch")}
        />
      </View>
    );
  }

  // Post-signup tutorial
  if (appState === "tutorial") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="dark" />
        <TutorialSlides
          userName={user?.name || ""}
          onFinish={() => setAppState("authenticated")}
        />
      </View>
    );
  }

  // Authenticated
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        inviteCode,
        setInviteCode,
        signIn: () => {},
        signOut,
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="user/[username]" options={{ presentation: "card" }} />
          <Stack.Screen name="posts/[username]" options={{ presentation: "card" }} />
        </Stack>
      </View>
    </AuthContext.Provider>
  );
}
