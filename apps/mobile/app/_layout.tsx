import "../global.css";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { colors } from "@garona/shared";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { LaunchScreen } from "../components/LaunchScreen";
import { SigninSheet } from "../components/SigninSheet";
import { SignupForm } from "../components/SignupForm";
import { TutorialSlides } from "../components/TutorialSlides";
import { meApi, type SignupResult } from "../lib/api";
import { AuthContext, type AuthUser } from "../lib/auth";
import { clearAllQueries, queryClient } from "../lib/queryClient";

type AppState = "loading" | "launch" | "signup" | "tutorial" | "authenticated";

let globalFontApplied = false;

function applyGlobalFontDefaults() {
  if (globalFontApplied) return;

  const textDefaultProps =
    (Text as typeof Text & { defaultProps?: { style?: unknown } })
      .defaultProps ?? {};
  const inputDefaultProps =
    (TextInput as typeof TextInput & { defaultProps?: { style?: unknown } })
      .defaultProps ?? {};
  const defaultFontStyle = { fontFamily: "Manrope_400Regular" };

  (Text as typeof Text & { defaultProps?: { style?: unknown } }).defaultProps =
    {
      ...textDefaultProps,
      style: textDefaultProps.style
        ? [defaultFontStyle, textDefaultProps.style]
        : defaultFontStyle,
    };

  (
    TextInput as typeof TextInput & { defaultProps?: { style?: unknown } }
  ).defaultProps = {
    ...inputDefaultProps,
    style: inputDefaultProps.style
      ? [defaultFontStyle, inputDefaultProps.style]
      : defaultFontStyle,
  };

  globalFontApplied = true;
}

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [user, setUser] = useState<AuthUser>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [fontsLoaded] = useFonts({
    AntiqueOliveNord: require("../assets/AntiqueOliveNord.woff"),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Check for OTA updates on mount
  useEffect(() => {
    if (__DEV__) return;
    Updates.checkForUpdateAsync()
      .then(({ isAvailable }) => {
        if (isAvailable) return Updates.fetchUpdateAsync();
      })
      .then((result) => {
        if (result?.isNew) Updates.reloadAsync();
      })
      .catch(() => {});
  }, []);

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
          rang: result.rang,
        });
        setAppState("authenticated");
      })
      .catch(() => {
        setAppState("launch");
      });
  }, []);

  useEffect(() => {
    if (fontsLoaded) applyGlobalFontDefaults();
  }, [fontsLoaded]);

  const handleSignedUp = useCallback((result: SignupResult) => {
    setUser({
      id: result.id,
      name: result.name,
      username: result.username,
      avatarUrl: result.avatarUrl,
      rang: result.rang,
    });
    setAppState("tutorial"); // Show tutorial after signup
  }, []);

  const handleSignedIn = useCallback((result: SignupResult) => {
    setUser({
      id: result.id,
      name: result.name,
      username: result.username,
      avatarUrl: result.avatarUrl,
      rang: result.rang,
    });
    setShowSignIn(false);
    setAppState("authenticated"); // Skip tutorial for returning users
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { authClient } = await import("../lib/auth-client");
      await authClient.signOut();
    } catch {}
    clearAllQueries();
    setUser(null);
    setAppState("launch");
  }, []);

  const devSkip = useCallback(() => {
    setUser({
      id: "dev-user",
      name: "Garona",
      username: "garona",
      avatarUrl: null,
      rang: 4,
    });
    setAppState("authenticated");
  }, []);

  // Loading — checking session
  if (!fontsLoaded || appState === "loading") {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Launch screen
  if (appState === "launch") {
    return (
      <View className="flex-1 bg-bg">
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
            className="absolute top-[60px] right-5 bg-[#333] px-3 py-1.5 rounded-md"
          >
            <Text className="text-white text-xs">⚡ Dev</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Sign up form
  if (appState === "signup") {
    return (
      <View className="flex-1 bg-bg">
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
      <View className="flex-1 bg-bg">
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
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          isLoading: false,
          signIn: () => {},
          signOut,
        }}
      >
        <View className="flex-1 bg-bg">
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="user/[username]"
              options={{ presentation: "card" }}
            />
            <Stack.Screen
              name="posts/[username]"
              options={{ presentation: "card" }}
            />
          </Stack>
        </View>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
