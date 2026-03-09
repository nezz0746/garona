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
import { isRunningInExpoGo } from "expo";
import { Stack, useNavigationContainerRef } from "expo-router";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,
  integrations: [navigationIntegration],
  enableNativeFramesTracking: !isRunningInExpoGo(),
  enabled: !__DEV__,
});

SplashScreen.preventAutoHideAsync();
import { ToastProvider } from "../components/Toast";
import { useNotifications } from "../hooks/useNotifications";
import { LaunchScreen } from "../components/LaunchScreen";
import { SigninSheet } from "../components/SigninSheet";
import { SignupForm } from "../components/SignupForm";
import { TutorialSlides } from "../components/TutorialSlides";
import { meApi, type SignupResult } from "../lib/api";
import { AuthContext, type AuthUser } from "../lib/auth";
import { clearAllQueries, queryClient } from "../lib/queryClient";

function NotificationRegistrar() {
  useNotifications();
  return null;
}

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

function RootLayout() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [user, setUser] = useState<AuthUser>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const navigationRef = useNavigationContainerRef();

  React.useEffect(() => {
    if (navigationRef) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);
  const [fontsLoaded] = useFonts({
    AntiqueOliveNord: require("../assets/AntiqueOliveNord.woff"),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // OTA update check + session check + fonts → then hide splash
  useEffect(() => {
    async function prepare() {
      // 1. Check for OTA updates (production only)
      if (!__DEV__) {
        try {
          const { isAvailable } = await Updates.checkForUpdateAsync();
          if (isAvailable) {
            const result = await Updates.fetchUpdateAsync();
            if (result.isNew) {
              await Updates.reloadAsync();
              return; // app will restart
            }
          }
        } catch {}
      }

      // 2. Check for existing session
      try {
        const result = await meApi.get();
        setUser({
          id: result.id,
          name: result.name,
          username: result.username,
          avatarUrl: result.avatarUrl,
          rang: result.rang,
        });
        setAppState("authenticated");
      } catch {
        setAppState("launch");
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) applyGlobalFontDefaults();
  }, [fontsLoaded]);

  // Hide splash once everything is ready
  useEffect(() => {
    if (fontsLoaded && appState !== "loading") {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appState]);

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

  // Loading — splash screen is still visible
  if (!fontsLoaded || appState === "loading") {
    return null;
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
          updateUser: (updates) => {
            setUser((prev) => prev ? { ...prev, ...updates } : prev);
          },
        }}
      >
        <ToastProvider>
          <NotificationRegistrar />
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
              <Stack.Screen
                name="post/[id]"
                options={{ presentation: "card" }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </View>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
