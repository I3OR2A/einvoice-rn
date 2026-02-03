import React, { useMemo } from "react";
import { View } from "react-native";
import { DataTable, Divider, Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useInvoices } from "../store/invoices";
import { Screen } from "../components/Screen";


type Props = NativeStackScreenProps<RootStackParamList, "InvoiceDetail">;

export function InvoiceDetailScreen({ route }: Props) {
  const { invoiceId } = route.params;
  const { getById } = useInvoices();
  const inv = getById(invoiceId);

  const total = useMemo(() => {
    if (!inv) return 0;
    // 若 DB 有 total 就優先用
    if (typeof inv.total === "number") return inv.total;
    return inv.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  }, [inv]);

  if (!inv) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>找不到這筆發票</Text>
      </View>
    );
  }

  const hasItems = inv.items.length > 0;

  return (
    
    <Screen>
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
          購買清單
        </Text>

        {!hasItems && (
          <>
            <Text style={{ marginBottom: 8 }}>解析失敗或沒有品項資料（顯示 raw 供 debug）</Text>
            <Divider style={{ marginVertical: 8 }} />
            <Text selectable>LEFT: {inv.rawLeft}</Text>
            {inv.rawRight ? <Text selectable>RIGHT: {inv.rawRight}</Text> : null}
          </>
        )}

        {hasItems && (
          <>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>品名</DataTable.Title>
                <DataTable.Title numeric>數量</DataTable.Title>
                <DataTable.Title numeric>單價</DataTable.Title>
                <DataTable.Title numeric>小計</DataTable.Title>
              </DataTable.Header>

              {inv.items.map((it, idx) => (
                <DataTable.Row key={`${idx}_${it.name}`}>
                  <DataTable.Cell style={{ flex: 2 }}>{it.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{it.qty}</DataTable.Cell>
                  <DataTable.Cell numeric>{it.unitPrice}</DataTable.Cell>
                  <DataTable.Cell numeric>{it.qty * it.unitPrice}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>

            <Divider style={{ marginVertical: 12 }} />
            <Text variant="titleMedium">合計：{total}</Text>
          </>
        )}
      </View>
    </Screen>
  );
}
