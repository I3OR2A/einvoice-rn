# einvoice-rn — Taiwan E-Invoice QR Scanner (Expo + SQLite)

> 使用 **React Native (Expo)** 快速做一個最小可用原型：  
> **掃描台灣紙本電子發票的左右 QR Code → 解析商品清單 → 存入 SQLite → 可在清單/明細頁回看**  

---

## Badges

![Expo](https://img.shields.io/badge/Expo-51%2B-000000?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.7x-61DAFB?logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-expo--sqlite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screens](#screens)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Features

- ✅ **一鍵拍照掃描**：對準發票左右 QR，一次拍照後從同一張照片掃出多顆 QR（更穩）
- ✅ **自動判斷 LEFT/RIGHT**：不需要使用者猜左右
- ✅ **商品清單解析（Parser v0）**：從 QR payload 拆出 `name / qty / unitPrice`
- ✅ **SQLite 持久化**：掃描結果寫入 `expo-sqlite`，重開 App 仍可回看
- ✅ **發票清單頁 / 明細頁**：使用 React Native Paper 呈現列表與 DataTable
- ✅ **可重現打包**：`scripts/build_release.sh` 由 tag 產出 zip
- ✅ **推 tag 自動發版**：GitHub Actions 自動建立 Release 並附上 zip

---

## Tech Stack

- **Runtime**: Expo (React Native)
- **UI**: React Native Paper (Material 3)
- **Camera / QR**: `expo-camera`（拍照 + `scanFromURLAsync`）
- **Storage**: `expo-sqlite`
- **CI/CD**: GitHub Actions（Tag-based Release）

---

## Screens

- **InvoicesList**：已掃描發票清單（SQLite 讀取）
- **ScanInvoice**：相機畫面 + 一鍵拍照掃描 + 自動判左右
- **InvoiceDetail**：商品明細（DataTable）+ raw debug（解析失敗時）

> 📷 Screenshots / GIF：  
> 建議放在 `docs/images/`，並在此段落補上截圖或 demo gif，例如：
>
> - `docs/images/demo.gif`
> - `docs/images/scan.png`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (或 npm)
- Expo CLI（可用 `npx expo`）
- 實機測試建議用 iOS/Android（相機功能）

### Installation

```bash
git clone https://github.com/<your-name>/einvoice-rn.git
cd einvoice-rn
yarn
```

### Run (Development)

```bash
npx expo start
```

- iOS：用 Camera（Expo Go）或 Dev Client 開啟
- Android：用 Camera（Expo Go）或 Dev Client 開啟

> 建議用實機掃發票 QR，模擬器通常無法正常使用相機。

---

## Usage

### 1) 掃描發票

1. 進入 **ScanInvoice**
2. 把發票 **左右兩個 QR code 一起放進鏡頭畫面**
3. 點 **「一鍵拍照掃描」**
4. 成功後會：
   - 自動判斷 left/right
   - 解析商品清單
   - 存入 SQLite
   - **自動跳到明細頁**

### 2) 回看清單與明細

- 回到 **InvoicesList** 可看到歷史掃描紀錄（依時間排序）
- 點擊卡片進入 **InvoiceDetail** 查看商品列表

---

## Project Structure

```
src/
  domain/                 # type definitions
    types.ts
  parser/                 # e-invoice QR parser (v0)
    einvoice.ts
  storage/                # sqlite db/migrations/repo
    db.ts
    migrations.ts
    invoice_repo.ts
  store/                  # provider/context (sqlite as source of truth)
    invoices.tsx
  navigation/
    types.ts
  screens/
    InvoicesListScreen.tsx
    ScanInvoiceScreen.tsx
    InvoiceDetailScreen.tsx

scripts/
  build_release.sh        # reproducible release zip from git tag

.github/
  workflows/
    release.yml           # push tag -> create GitHub Release + upload zip
  release-notes/
    v1.0.0.md             # optional custom release notes per tag
```

---

## Known Limitations

- Parser 目前為 **heuristic v0** ，不同店家/格式可能仍會解析不到完整品項
- `scanFromURLAsync` 的成功率會受：
  - 光線、焦距、QR 大小、是否清晰同框左右 QR 等因素影響

---

## License

MIT License. See `LICENSE`.
