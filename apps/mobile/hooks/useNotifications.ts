import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { router } from "expo-router";
import { pushApi } from "../lib/api";

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[push] Must use physical device for push notifications");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Permission not granted");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data;
}

/**
 * Hook to register for push notifications and listen for incoming notifications.
 * Prompts for permission on mount. Call once in the authenticated root.
 */
export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) pushApi.register(token, Platform.OS).catch(console.error);
      })
      .catch(console.error);

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[push] Notification received:", notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data?.type === "like" || data?.type === "comment") {
        if (data.postId) {
          router.push(`/posts/${data.username}?postId=${data.postId}`);
        }
      } else if (data?.type === "follow") {
        if (data.username) {
          router.push(`/user/${data.username}`);
        }
      } else {
        router.navigate("/(tabs)/activity");
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
