import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { Button, Text, Banner } from "react-native-paper";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";

export function ScanInvoiceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [last, setLast] = useState<string>("");

  const onBarcodeScanned = useCallback((res: BarcodeScanningResult) => {
    if (!res.data) return;
    setLast(res.data);
  }, []);

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ marginBottom: 12 }}>需要相機權限才能掃描發票 QR Code</Text>
        <Button mode="contained" onPress={requestPermission}>允許相機權限</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={onBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <Banner visible={true} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Text numberOfLines={3}>掃描結果：{last || "（尚未掃到）"}</Text>
      </Banner>
    </View>
  );
}
