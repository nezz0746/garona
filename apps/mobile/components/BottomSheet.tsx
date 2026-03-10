import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from "react-native";

const SCREEN_H = Dimensions.get("window").height;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Max height as fraction of screen (0-1). Default 0.5 */
  maxHeightRatio?: number;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, maxHeightRatio = 0.5, children }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [show, setShow] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const maxH = SCREEN_H * maxHeightRatio;
  // Sheet height = content height capped at max
  const sheetHeight = contentHeight > 0 ? Math.min(contentHeight, maxH) : undefined;
  const needsScroll = contentHeight > maxH;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          close();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }).start();
        }
      },
    }),
  ).current;

  const open = () => {
    setShow(true);
    translateY.setValue(SCREEN_H);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const close = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShow(false);
      onClose();
    });
  };

  useEffect(() => {
    if (visible) open();
    else if (show) close();
  }, [visible]);

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - contentHeight) > 2) setContentHeight(h);
  };

  if (!show && !visible) return null;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", opacity: backdropOpacity }}
      >
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: maxH,
          backgroundColor: "white",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: [{ translateY }],
          // Don't set fixed height if we don't know content yet
          ...(sheetHeight ? { height: sheetHeight } : {}),
        }}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={{ alignItems: "center", paddingVertical: 10 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#d1d5db" }} />
        </View>

        {/* Content — measure first, then render in scroll if needed */}
        {needsScroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 34 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View onLayout={onContentLayout} style={{ paddingBottom: 34 }}>
            {children}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}
