import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { PokeCard } from "@/components/PokeCard";
import { SearchFilters } from "@/components/SearchFilters";
import { EMPTY_FILTERS, SearchFilters as Filters, SearchPokemon, SearchSession, searchCandidates, searchPage, validateFilters } from "@/utils/pokemonSearch";

const GAP = 12;
const MAX_WIDTH = 1180;

export default function Index() {
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 5 : width >= 820 ? 4 : width >= 600 ? 3 : width >= 340 ? 2 : 1;
  const cardWidth = (Math.min(width, MAX_WIDTH) - 32 - GAP * (columns - 1)) / columns;
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [results, setResults] = useState<SearchPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [retry, setRetry] = useState(0);
  const session = useRef<SearchSession | null>(null);
  const request = useRef({ cancelled: false });
  const busy = useRef(false);
  const activeFilters = filters.type !== "" || filters.hpMin !== "" || filters.hpMax !== "" || filters.damageMin !== "" || filters.damageMax !== "" || !!filters.move.trim() || !!filters.species.trim();
  const hasMore = progress.checked < progress.total;

  useEffect(() => {
    const currentRequest = { cancelled: false };
    request.current = currentRequest;
    const cancelled = () => currentRequest.cancelled;
    session.current = null;
    busy.current = true;
    setLoading(true); setError(""); setResults([]); setProgress({ checked: 0, total: 0 });
    const timeout = setTimeout(async () => {
      try {
        const candidates = await searchCandidates(query, filters);
        if (cancelled()) return;
        const next = { candidates, cursor: 0, filters };
        const page = await searchPage(next, cancelled);
        if (cancelled()) return;
        next.cursor = page.cursor;
        session.current = next;
        setResults(page.found);
        setProgress({ checked: next.cursor, total: candidates.length });
      } catch (e) {
        if (!cancelled()) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "Search timed out. Please try again.");
      } finally { if (!cancelled()) { busy.current = false; setLoading(false); } }
    }, 300);
    return () => { clearTimeout(timeout); currentRequest.cancelled = true; };
  }, [query, filters, retry]);

  async function loadMore() {
    const next = session.current;
    if (busy.current || !next || next.cursor >= next.candidates.length) return;
    const currentRequest = request.current;
    const cancelled = () => currentRequest.cancelled;
    busy.current = true; setLoading(true); setError("");
    try {
      const page = await searchPage(next, cancelled);
      if (cancelled()) return;
      next.cursor = page.cursor;
      setResults(current => [...current, ...page.found]);
      setProgress({ checked: next.cursor, total: next.candidates.length });
    } catch (e) {
      if (!cancelled()) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "Search timed out. Please try again.");
    } finally { if (!cancelled()) { busy.current = false; setLoading(false); } }
  }

  function applyFilters() {
    const message = validateFilters(draft);
    setFilterError(message);
    if (!message) setFilters({ ...draft });
  }

  return <View style={styles.screen}>
    <FlatList key={`pokemon-${columns}`} data={results} keyExtractor={pokemon => pokemon.name} numColumns={columns}
      keyboardShouldPersistTaps="handled" style={styles.list} contentContainerStyle={styles.content}
      columnWrapperStyle={columns > 1 ? { gap: GAP } : undefined}
      onEndReached={() => { if (!activeFilters && !error) void loadMore(); }} onEndReachedThreshold={0.3}
      ListHeaderComponent={<View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Pokémon Search</Text>
        <View style={styles.row}>
          <TextInput accessibilityLabel="Search Pokémon by name or number" value={query} onChangeText={setQuery} placeholder="Search name or number…" placeholderTextColor="#7A8596" autoCapitalize="none" autoCorrect={false} style={styles.input} />
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showFilters }} onPress={() => setShowFilters(current => !current)} style={[styles.button, activeFilters && styles.activeButton]}><Text style={activeFilters ? styles.white : styles.link}>Filters{activeFilters ? " •" : ""}</Text></Pressable>
        </View>
        {showFilters ? <SearchFilters value={draft} onChange={setDraft} onApply={applyFilters} onClear={() => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setFilterError(""); }} error={filterError} /> : null}
        <Text accessibilityLiveRegion="polite" style={styles.body}>{loading && !results.length ? "Searching Pokémon…" : `${results.length} results · ${progress.checked} of ${progress.total} candidates checked`}</Text>
        {activeFilters && hasMore ? <Text style={styles.body}>Filters apply across the full Pokédex. Use “Search more” to check the next batch.</Text> : null}
      </View>}
      ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>{hasMore ? "No matches in this batch. Search more to continue." : "No Pokémon match. Try changing your search or filters."}</Text> : null}
      ListFooterComponent={<View style={styles.footer}>
        {loading ? <ActivityIndicator accessibilityLabel="Searching Pokémon" /> : null}
        {error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => session.current ? void loadMore() : setRetry(current => current + 1)} style={styles.button}><Text style={styles.link}>Retry search</Text></Pressable></> : null}
        {!loading && !error && hasMore ? <Pressable accessibilityRole="button" onPress={loadMore} style={styles.button}><Text style={styles.link}>Search more</Text></Pressable> : null}
      </View>}
      renderItem={({ item }) => <View style={{ width: cardWidth, marginBottom: GAP }}>
        <PokeCard pokemon={item} width={cardWidth} onPress={() => router.push({ pathname: "/details", params: { id: item.url.split("/").filter(Boolean).pop() } })} />
        <Text style={styles.cardStats}>HP {item.hp} · Atk {item.attack} · SpA {item.specialAttack}</Text>
      </View>} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  list: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  content: { padding: 16 },
  header: { gap: 12, marginBottom: 16 },
  title: { color: "#1C2636", fontFamily: "Courier New", fontSize: 24, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8 },
  input: { flex: 1, minWidth: 0, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#D6DFEA", borderRadius: 8, color: "#1C2636", padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#D6DFEA", borderRadius: 8, padding: 12, minHeight: 44, justifyContent: "center" },
  activeButton: { backgroundColor: "#315D65" },
  link: { color: "#315D65", fontSize: 13, fontWeight: "600" },
  white: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  body: { color: "#687386", fontSize: 12, lineHeight: 18 },
  cardStats: { color: "#586678", fontSize: 10, textAlign: "center", paddingTop: 6 },
  footer: { alignItems: "center", gap: 12, paddingVertical: 20 },
  empty: { color: "#687386", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  error: { color: "#B33D37", fontSize: 13, lineHeight: 20 },
});
