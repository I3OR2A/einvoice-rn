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

type ScanStep = "scanning" | "processing" | "done";

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

export function ScanInvoiceScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView | null>(null);

  const [step, setStep] = useState<ScanStep>("scanning");
  const [left, setLeft] = useState<string>("");
  const [right, setRight] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 去抖：避免連點
  const inFlightRef = useRef(false);

  const hint = useMemo(() => {
    if (step === "processing") return "📸 拍照中 / 掃描中…";
    if (step === "done") return "✅ 已取得左右 QR，Day4 會開始解析";
    if (!left && !right) return "把兩個 QR 一起放進鏡頭畫面內，按「一鍵拍照掃描」";
    if (left && !right) return "只掃到主碼（LEFT），請再拍一次（確保兩顆 QR 都入鏡）";
    if (!left && right) return "只掃到補碼（RIGHT），請再拍一次（確保兩顆 QR 都入鏡）";
    return "準備就緒";
  }, [step, left, right]);

  const reset = () => {
    setLeft("");
    setRight("");
    setErrorMsg("");
    setStep("scanning");
    inFlightRef.current = false;
  };

  const applyTwoResults = useCallback((a: BarcodeScanningResult, b: BarcodeScanningResult) => {
    const aData = (a.data ?? "").trim();
    const bData = (b.data ?? "").trim();

    const aPart = classifyPart(aData);
    const bPart = classifyPart(bData);

    // 1) 內容規則最優先：** 開頭視為 RIGHT
    if (aPart !== bPart) {
      const leftRaw = aPart === "LEFT" ? aData : bData;
      const rightRaw = aPart === "RIGHT" ? aData : bData;
      setLeft(leftRaw);
      setRight(normalizeRight(rightRaw));
      setStep("done");
      return;
    }

    // 2) fallback：用 x 座標排序（沒有就用原順序）
    const ax = centerX(a);
    const bx = centerX(b);

    if (ax != null && bx != null) {
      const [l, r] = ax <= bx ? [aData, bData] : [bData, aData];
      setLeft(l);
      setRight(normalizeRight(r));
      setStep("done");
      return;
    }

    // 3) 最後 fallback：用原順序（仍可用 Day4 parse 再做更嚴謹判斷）
    setLeft(aData);
    setRight(normalizeRight(bData));
    setStep("done");
  }, []);

  const takePhotoAndScan = useCallback(async () => {
    if (inFlightRef.current) return; // 去抖：避免連點
    if (step === "processing") return;

    setErrorMsg("");
    inFlightRef.current = true;
    setStep("processing");

    try {
      const refAny = cameraRef.current as any;
      if (!refAny) throw new Error("camera ref not ready");

      // 兼容不同版本方法名：takePictureAsync / takePicture
      const take = refAny.takePictureAsync ?? refAny.takePicture;
      if (!take) throw new Error("takePictureAsync not available");

      const photo = await take.call(refAny, {
        quality: 0.8,
        base64: false,
        // 若你想更快：可嘗試 skipProcessing: true（但可能有旋轉/EXIF 顯示問題）
        // skipProcessing: true,
      });

      const uri: string | undefined = photo?.uri;
      if (!uri) throw new Error("photo uri missing");

      // 從同一張照片掃出所有 QR（回傳陣列）
      const results = await scanFromURLAsync(uri, ["qr" as BarcodeType]);
      const uniq = uniqByData(results);

      if (uniq.length >= 2) {
        applyTwoResults(uniq[0], uniq[1]);
      } else if (uniq.length === 1) {
        const raw = (uniq[0].data ?? "").trim();
        const part = classifyPart(raw);
        if (part === "LEFT") setLeft((prev) => prev || raw);
        else setRight((prev) => prev || normalizeRight(raw));
        setStep("scanning"); // 只掃到一顆，回到可再拍狀態
      } else {
        setErrorMsg("沒有掃到 QR，請提高亮度/拉近一點/確保兩顆 QR 都入鏡再拍一次");
        setStep("scanning");
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "拍照或掃描失敗，請再試一次");
      setStep("scanning");
    } finally {
      // 允許再次按鈕（稍微延遲能避免誤觸連點）
      setTimeout(() => {
        inFlightRef.current = false;
      }, 600);
    }
  }, [applyTwoResults, step]);

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
        // robust 模式：不靠即時 onBarcodeScanned（它一次只回一個）
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

          <Button
            mode="contained"
            onPress={takePhotoAndScan}
            disabled={step === "processing"}
          >
            一鍵拍照掃描
          </Button>
        </View>
      </Banner>
    </View>
  );
}
