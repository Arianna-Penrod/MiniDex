import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFavorites } from "./FavoritesProvider";

const items = [
  { label: "Search", path: "/", icon: "search-outline" },
  { label: "Team Builder", path: "/team", icon: "people-outline" },
  { label: "Profile", path: null, icon: "person-outline" },
  { label: "Favorites", path: "/favorites", icon: "heart-outline" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { storageError } = useFavorites();
  return <SafeAreaView edges={["bottom"]} style={styles.container}>
    {storageError ? <Text accessibilityRole="alert" style={styles.error}>{storageError}</Text> : null}
    <View style={styles.row}>
      {items.map(item => {
        const active = item.path === pathname;
        return <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.path ? item.label : "Profile, coming soon"}
          accessibilityState={{ selected: active, disabled: !item.path }} disabled={!item.path}
          onPress={() => { if (item.path && !active) router.navigate(item.path); }}
          style={({ pressed }) => [styles.item, active && styles.active, !item.path && styles.disabled, pressed && { opacity: 0.65 }]}>
          <Ionicons name={item.icon} size={21} color={active ? "#315D65" : "#687386"} />
          <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          {!item.path ? <Text style={styles.soon}>Coming soon</Text> : null}
        </Pressable>;
      })}
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#D6DFEA" },
  row: { flexDirection: "row", width: "100%", maxWidth: 1100, alignSelf: "center", padding: 6, gap: 4 },
  item: { flex: 1, minHeight: 65, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 6, borderRadius: 8 },
  active: { backgroundColor: "#E7F0EF" },
  disabled: { opacity: 0.55 },
  label: { fontSize: 11, fontWeight: "600", color: "#687386", textAlign: "center" },
  activeLabel: { color: "#315D65" },
  soon: { color: "#687386", fontSize: 9 },
  error: { fontSize: 12, lineHeight: 18, color: "#B33D37", padding: 8, textAlign: "center" },
});
