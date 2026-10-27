import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { PokeCard } from "@/components/PokeCard";
import { useFavorites } from "@/components/FavoritesProvider";

export default function Favorites() {
  const { favorites, ready } = useFavorites();
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 5 : width >= 820 ? 4 : width >= 600 ? 3 : width >= 340 ? 2 : 1;
  const cardWidth = (Math.min(width, 1180) - 32 - (columns - 1) * 12) / columns;
  return <View style={styles.screen}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>Favorites</Text>
      <Text style={styles.body}>Your saved Pokémon, all in one place. Tap a card to view its information.</Text>
      <Text style={styles.body}>{favorites.length} saved · Stored on this device</Text>
    </View>
    {!ready ? <ActivityIndicator accessibilityLabel="Loading favorites" style={{ marginTop: 24 }} /> :
      <FlatList key={`favorites-${columns}`} data={favorites} keyExtractor={item => item.name} numColumns={columns}
        style={styles.list} contentContainerStyle={{ padding: 16 }} columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.title}>Keep your favorites close.</Text><Text style={styles.body}>Tap the heart on a Pokémon card to save it here.</Text><Pressable accessibilityRole="button" onPress={() => router.navigate("/")} style={styles.button}><Text style={styles.buttonText}>Find Pokémon</Text></Pressable></View>}
        renderItem={({ item }) => <View style={{ width: cardWidth, gap: 8, marginBottom: 16 }}>
          <PokeCard pokemon={item} width={cardWidth} onPress={() => router.push({ pathname: "/details", params: { id: item.url.split("/").filter(Boolean).pop() } })} />
        </View>} />}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  header: { width: "100%", maxWidth: 1180, alignSelf: "center", padding: 16, gap: 8 },
  title: { color: "#1C2636", fontSize: 24, fontWeight: "800" },
  body: { color: "#687386", fontSize: 14, lineHeight: 22 },
  list: { width: "100%", maxWidth: 1180, alignSelf: "center" },
  empty: { paddingVertical: 40, alignItems: "center", gap: 16 },
  button: { padding: 14, borderRadius: 8, backgroundColor: "#315D65" },
  buttonText: { color: "#FFF", fontWeight: "700" },
});
