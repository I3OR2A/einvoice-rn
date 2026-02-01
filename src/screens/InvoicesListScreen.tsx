import React from "react";
import { View } from "react-native";
import { FAB, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "InvoicesList">;

export function InvoicesListScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>這裡會顯示發票清單（Day6 完成）</Text>

      <FAB
        icon="qrcode-scan"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => navigation.navigate("ScanInvoice")}
        label="掃描"
      />
    </View>
  );
}
