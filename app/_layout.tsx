import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { Navbar } from "@/components/Navbar";

export default function RootLayout() {
  return <SafeAreaProvider><FavoritesProvider>
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#F4F7FB" }}>
      <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false }} /></View>
      <Navbar />
    </SafeAreaView>
  </FavoritesProvider></SafeAreaProvider>;
}
