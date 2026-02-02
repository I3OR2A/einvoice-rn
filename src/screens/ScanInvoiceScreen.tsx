import React, { useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Button, Text, Banner } from "react-native-paper";
import {
  CameraView,
  useCameraPermissions,
  scanFromURLAsync,
  type BarcodeScanningResult,
  type BarcodeType,
} from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import { useInvoices } from "../store/invoices";
import { parseEInvoiceQRCodes } from "../parser/einvoice";

type Props = NativeStackScreenProps<RootStackParamList, "ScanInvoice">;

type ScanStep = "ready" | "processing";

type Part = "LEFT" | "RIGHT";

function classifyPart(raw: string): Part {
  const s = raw.trim();
  // 常見：右 QR 接續段以 ** 開頭
  if (s.startsWith("**")) return "RIGHT";
  return "LEFT";
}

function normalizeRight(raw: string) {
  const s = raw.trim();
  return s.startsWith("**") ? s.slice(2) : s;
}

function centerX(r: BarcodeScanningResult): number | null {
  const cps = r.cornerPoints ?? [];
  if (cps.length >= 2) {
    const sum = cps.reduce((acc, p) => acc + (p?.x ?? 0), 0);
    return sum / cps.length;
  }
  const b = r.bounds;
  if (b?.origin && b?.size) {
    return (b.origin.x ?? 0) + (b.size.width ?? 0) / 2;
  }
  return null;
}

function uniqByData(results: BarcodeScanningResult[]) {
  const seen = new Set<string>();
  const out: BarcodeScanningResult[] = [];
  for (const r of results) {
    const d = (r.data ?? "").trim();
    if (!d) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(r);
  }
  return out;
}

export function ScanInvoiceScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const { save } = useInvoices();

  const cameraRef = useRef<CameraView | null>(null);

  const [step, setStep] = useState<ScanStep>("ready");
  const [left, setLeft] = useState<string>("");
  const [right, setRight] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 去抖：避免連點、避免同一輪流程重入
  const inFlightRef = useRef(false);

  const reset = () => {
    setLeft("");
    setRight("");
    setErrorMsg("");
    setStep("ready");
    inFlightRef.current = false;
  };

  const hint = useMemo(() => {
    if (step === "processing") return "📸 拍照中 / 掃描中…";
    if (!left && !right) return "把兩個 QR 一起放進鏡頭畫面內，按「一鍵拍照掃描」";
    if (left && !right) return "只掃到主碼（LEFT），請再拍一次（確保兩顆 QR 都入鏡）";
    if (!left && right) return "只掃到補碼（RIGHT），請再拍一次（確保兩顆 QR 都入鏡）";
    return "✅ 已取得左右 QR（將自動存檔並跳轉）";
  }, [step, left, right]);

  const finalize = useCallback(
    (leftRaw: string, rightRaw: string) => {
      // Day4 parser
      const inv = parseEInvoiceQRCodes(leftRaw, rightRaw);

      // Week2 sqlite provider save
      save(inv);

      // 自動跳明細（解掉 cannot found navigation：這裡有正確 props）
      navigation.replace("InvoiceDetail", { invoiceId: inv.id });
    },
    [navigation, save]
  );

  const pickLeftRightFromResults = useCallback((results: BarcodeScanningResult[]) => {
    // 先用內容規則（** 開頭）判 RIGHT
    let leftData = "";
    let rightData = "";

    for (const r of results) {
      const d = (r.data ?? "").trim();
      if (!d) continue;
      const part = classifyPart(d);
      if (part === "RIGHT" && !rightData) rightData = d;
      if (part === "LEFT" && !leftData) leftData = d;
    }

    if (leftData && rightData) {
      return { left: leftData, right: normalizeRight(rightData) };
    }

    // 內容規則不足 → fallback 用 X 座標排序挑兩個
    if (results.length >= 2) {
      const a = results[0];
      const b = results[1];

      const ax = centerX(a);
      const bx = centerX(b);

      const aData = (a.data ?? "").trim();
      const bData = (b.data ?? "").trim();

      if (ax != null && bx != null) {
        const [l, r] = ax <= bx ? [aData, bData] : [bData, aData];
        return { left: l, right: normalizeRight(r) };
      }

      // 最後 fallback：順序（仍可用 parser 再容錯）
      return { left: aData, right: normalizeRight(bData) };
    }

    // 只剩 0 或 1 筆：交給上層決定怎麼提示
    return { left: leftData, right: normalizeRight(rightData) };
  }, []);

  const takePhotoAndScan = useCallback(async () => {
    if (inFlightRef.current) return;
    if (step === "processing") return;

    setErrorMsg("");
    setStep("processing");
    inFlightRef.current = true;

    try {
      const camAny = cameraRef.current as any;
      if (!camAny) throw new Error("camera not ready");

      // 兼容不同 Expo Camera 版本：takePictureAsync / takePicture
      const take = camAny.takePictureAsync ?? camAny.takePicture;
      if (!take) throw new Error("takePictureAsync not available");

      const photo = await take.call(camAny, {
        quality: 0.85,
        base64: false,
        // 想更快可以開，但少數機型可能有 EXIF/旋轉問題：
        // skipProcessing: true,
      });

      const uri: string | undefined = photo?.uri;
      if (!uri) throw new Error("photo uri missing");

      // 同張圖一次掃多顆（回傳陣列）
      const results = await scanFromURLAsync(uri, ["qr" as BarcodeType]);
      const uniq = uniqByData(results);

      if (uniq.length >= 2) {
        const picked = pickLeftRightFromResults(uniq);

        // 更新 UI（可視化）
        setLeft(picked.left);
        setRight(picked.right);

        // ✅ 直接 finalize：parse + save + navigate（0 額外操作）
        finalize(picked.left, picked.right);
        return;
      }

      if (uniq.length === 1) {
        // 只掃到一顆：先存起來，提示再拍一次（不要求使用者判斷左右）
        const raw = (uniq[0].data ?? "").trim();
        const part = classifyPart(raw);
        if (part === "LEFT") setLeft((prev) => prev || raw);
        else setRight((prev) => prev || normalizeRight(raw));

        setStep("ready");
        return;
      }

      // 0 顆
      setErrorMsg("沒有掃到 QR，請提高亮度/拉近一點/確保兩顆 QR 都入鏡再拍一次");
      setStep("ready");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "拍照或掃描失敗，請再試一次");
      setStep("ready");
    } finally {
      // 小延遲解鎖，避免使用者誤觸連點
      setTimeout(() => {
        inFlightRef.current = false;
      }, 500);
    }
  }, [finalize, pickLeftRightFromResults, step]);

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ marginBottom: 12 }}>需要相機權限才能掃描發票 QR Code</Text>
        <Button mode="contained" onPress={requestPermission}>
          允許相機權限
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        // robust 模式：不依賴即時掃描 callback
        onBarcodeScanned={undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <Banner visible={true} style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Text style={{ marginBottom: 6 }}>{hint}</Text>
        {!!errorMsg && <Text style={{ marginBottom: 6 }}>⚠️ {errorMsg}</Text>}

        <Text numberOfLines={1}>LEFT：{left ? "✅ 已取得" : "—"}</Text>
        <Text numberOfLines={1}>RIGHT：{right ? "✅ 已取得" : "—"}</Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Button mode="outlined" onPress={reset} disabled={step === "processing"}>
            重掃
          </Button>

          <Button mode="contained" onPress={takePhotoAndScan} disabled={step === "processing"}>
            一鍵拍照掃描
          </Button>
        </View>
      </Banner>
    </View>
  );
}
