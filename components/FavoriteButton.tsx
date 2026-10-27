import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pokemon } from "@/types/pokemon";
import { useFavorites } from "./FavoritesProvider";

export function FavoriteButton({ pokemon }: { pokemon: Pokemon }) {
  const { favorites, ready, toggleFavorite } = useFavorites();
  const saved = favorites.some(item => item.name === pokemon.name);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? "Remove" : "Save"} ${pokemon.name} ${saved ? "from" : "to"} favorites`}
    accessibilityState={{ disabled: !ready, selected: saved }} disabled={!ready} onPress={() => toggleFavorite(pokemon)}
    style={({ pressed }) => [styles.button, saved && styles.saved, (pressed || !ready) && { opacity: 0.6 }]}>
    <Ionicons name={saved ? "heart" : "heart-outline"} size={22} color={saved ? "#B33D59" : "#315D65"} />
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, alignSelf: "flex-end", alignItems: "center", justifyContent: "center" },
  saved: { backgroundColor: "rgba(255,255,255,0.45)" },
});
