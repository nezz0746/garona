import { useState, useEffect } from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@garona/shared";

type Props = {
  onCodeScanned: (code: string) => void;
  onClose: () => void;
};

export function QRScanner({ onCodeScanned, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center px-10 bg-bg gap-4">
          <Ionicons name="camera-outline" size={48} color={colors.primary} />
          <Text className="text-[22px] font-bold text-text">Caméra requise</Text>
          <Text className="text-[15px] text-text-secondary text-center leading-[22px]">
            Pour scanner un QR code, Garona a besoin d'accéder à ta caméra.
          </Text>
          <Pressable className="bg-primary px-8 py-3.5 rounded-xl mt-2" onPress={requestPermission}>
            <Text className="text-white text-base font-semibold">Autoriser la caméra</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text className="text-text-muted text-[15px] mt-2">Annuler</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    onCodeScanned(data);
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        className="flex-1"
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4" style={{ paddingTop: 60 }}>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Scanner un QR code</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Scanner frame */}
          <View className="flex-1 justify-center items-center">
            <View style={{ width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 16, backgroundColor: "transparent" }}>
              {/* Corner decorations */}
              <View style={[cornerBase, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 }]} />
              <View style={[cornerBase, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 }]} />
              <View style={[cornerBase, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 }]} />
              <View style={[cornerBase, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 }]} />
            </View>
          </View>

          {/* Instructions */}
          <View className="items-center py-6">
            <Text className="text-white text-[15px] text-center" style={{ opacity: 0.9 }}>
              Pointe ta caméra vers le QR code
            </Text>
          </View>

          {/* Manual input */}
          <Pressable
            className="flex-row items-center justify-center gap-2 pb-12"
            onPress={() => {
              onClose();
              // Could open a text input modal instead
            }}
          >
            <Ionicons name="link-outline" size={18} color="#fff" />
            <Text className="text-white text-sm underline" style={{ opacity: 0.7 }}>J'ai un lien à la place</Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const FRAME_SIZE = 250;

const cornerBase = {
  position: "absolute" as const,
  width: 30,
  height: 30,
  borderColor: colors.primary,
};
