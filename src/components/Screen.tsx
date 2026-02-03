import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";


type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;          // 內容左右/上 padding
  bottomPadding?: number;    // 額外底部 padding
};

export function Screen({ children, style, padding = 0, bottomPadding = 0 }: Props) {

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: padding,
          paddingLeft: padding,
          paddingRight: padding,
          // ✅ 重點：每頁都有底部安全區
          paddingBottom: bottomPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
