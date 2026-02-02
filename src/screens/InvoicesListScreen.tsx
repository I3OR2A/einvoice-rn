import React from "react";
import { ScrollView, View } from "react-native";
import { Card, FAB, Text, Button } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useInvoices } from "../store/invoices";

type Props = NativeStackScreenProps<RootStackParamList, "InvoicesList">;

export function InvoicesListScreen({ navigation }: Props) {
  const { summaries, clearAll } = useInvoices();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="titleMedium">共 {summaries.length} 筆</Text>
          <Button mode="outlined" onPress={clearAll}>清空</Button>
        </View>

        {summaries.map((s) => {
          const created = new Date(s.createdAt).toLocaleString();
          return (
            <Card key={s.id} onPress={() => navigation.navigate("InvoiceDetail", { invoiceId: s.id })}>
              <Card.Title title={`發票 ${s.id.slice(-6)}`} subtitle={created} />
              <Card.Content>
                <Text>品項數：{s.itemsCount}</Text>
                <Text>合計：{s.total ?? "-"}</Text>
              </Card.Content>
            </Card>
          );
        })}

        {summaries.length === 0 && (
          <Text style={{ opacity: 0.7 }}>還沒有資料，按右下角開始掃描</Text>
        )}
      </ScrollView>

      <FAB
        icon="qrcode-scan"
        style={{ position: "absolute", right: 16, bottom: 16 }}
        onPress={() => navigation.navigate("ScanInvoice")}
        label="掃描"
      />
    </View>
  );
}
