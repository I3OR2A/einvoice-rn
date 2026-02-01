import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider } from "react-native-paper";

import type { RootStackParamList } from "./src/navigation/types";
import { InvoicesProvider } from "./src/store/invoices";
import { InvoicesListScreen } from "./src/screens/InvoicesListScreen";
import { ScanInvoiceScreen } from "./src/screens/ScanInvoiceScreen";
import { InvoiceDetailScreen } from "./src/screens/InvoiceDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <InvoicesProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: "發票清單" }} />
            <Stack.Screen name="ScanInvoice" component={ScanInvoiceScreen} options={{ title: "掃描發票" }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "發票明細" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </InvoicesProvider>
    </PaperProvider>
  );
}
