import React from "react";
import { useColorScheme } from "react-native";
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { RootStackParamList } from "./src/navigation/types";
import { InvoicesProvider } from "./src/store/invoices";
import { InvoicesListScreen } from "./src/screens/InvoicesListScreen";
import { ScanInvoiceScreen } from "./src/screens/ScanInvoiceScreen";
import { InvoiceDetailScreen } from "./src/screens/InvoiceDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const scheme = useColorScheme(); // 'dark' | 'light'
  const isDark = "dark" === "dark";

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const navTheme = isDark ? NavDarkTheme : NavDefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <InvoicesProvider>
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: paperTheme.colors.elevation.level2 },
                headerTintColor: paperTheme.colors.onSurface,
                headerTitleStyle: { color: paperTheme.colors.onSurface },
                contentStyle: { backgroundColor: paperTheme.colors.background },
              }}
            >
              <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: "發票清單" }} />
              <Stack.Screen name="ScanInvoice" component={ScanInvoiceScreen} options={{ title: "掃描發票" }} />
              <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "發票明細" }} />
            </Stack.Navigator>
          </NavigationContainer>
        </InvoicesProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
