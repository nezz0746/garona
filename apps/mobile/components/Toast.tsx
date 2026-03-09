import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

type ToastType = "success" | "error" | "info";

type ToastData = {
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastContextType = {
  show: (data: ToastData) => void;
};

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

const BG_COLORS: Record<ToastType, string> = {
  success: "#0f172a",
  error: "#dc2626",
  info: "#0f172a",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  const show = useCallback(
    (data: ToastData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast(data);
      translateY.setValue(-100);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 150 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      timeoutRef.current = setTimeout(hide, data.duration ?? 3000);
    },
    [translateY, opacity, hide],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 16,
            right: 16,
            transform: [{ translateY }],
            opacity,
            zIndex: 9999,
          }}
          pointerEvents="box-none"
        >
          <Pressable onPress={hide}>
            <View
              style={{
                backgroundColor: BG_COLORS[toast.type],
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Ionicons name={ICONS[toast.type]} size={22} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 }}>
                {toast.message}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
