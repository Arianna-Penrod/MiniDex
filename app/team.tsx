import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { PokemonName, pokemonSuggestions } from "@/utils/pokemonSuggestions";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { analyzeTeam, damageMultiplier, STAT_LABELS, STAT_NAMES, TeamMember, TypeRelations } from "@/utils/teamAnalysis";
import { hexToRgba, typeColor } from "@/utils/typeColors";

type PokemonResponse = {
  id: number; name: string; sprites: { front_default: string | null };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
};
const typeCache = new Map<string, TypeRelations>();
const pokemonCache = new Map<string, TeamMember>();
// Keep the current team when navigating to the Pokédex and back.
let sessionTeam: TeamMember[] = [];
let nameIndex: PokemonName[] = [];

async function getJson<T,>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/${path}`, { signal: controller.signal });
    if (response.status === 404) throw new Error("Pokémon not found. Try an exact name or Pokédex number.");
    if (!response.ok) throw new Error("PokéAPI is unavailable. Please try again.");
    return await response.json();
  } finally { clearTimeout(timeout); }
}

async function loadMember(query: string): Promise<TeamMember> {
  const cached = pokemonCache.get(query);
  if (cached) return cached;
  const data = await getJson<PokemonResponse>(`pokemon/${encodeURIComponent(query)}`);
  const types = data.types.map(item => item.type.name);
  const relations = await Promise.all(types.map(async type => {
    const cachedType = typeCache.get(type);
    if (cachedType) return cachedType;
    const result = await getJson<{ damage_relations: TypeRelations }>(`type/${type}`);
    typeCache.set(type, result.damage_relations);
    return result.damage_relations;
  }));
  const member = { id: data.id, name: data.name, sprite: data.sprites.front_default, types, relations,
    stats: STAT_NAMES.map(name => data.stats.find(stat => stat.stat.name === name)?.base_stat ?? 0) };
  pokemonCache.set(query, member);
  pokemonCache.set(data.name, member);
  return member;
}

export default function TeamBuilder() {
  const [team, setTeam] = useState<TeamMember[]>(sessionTeam);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [names, setNames] = useState<PokemonName[]>(nameIndex);
  const [indexStatus, setIndexStatus] = useState<"loading" | "ready" | "error">(nameIndex.length ? "ready" : "loading");
  const [retryIndex, setRetryIndex] = useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const busy = useRef(false);
  const analysis = analyzeTeam(team);
  const suggestions = pokemonSuggestions(names, query, team.map(member => member.name));

  useEffect(() => {
    let cancelled = false;
    async function loadNames() {
      if (nameIndex.length) { setNames(nameIndex); setIndexStatus("ready"); return; }
      setIndexStatus("loading");
      try {
        const result = await getJson<{ results: PokemonName[] }>("pokemon?limit=100000&offset=0");
        nameIndex = result.results;
        if (!cancelled) { setNames(nameIndex); setIndexStatus("ready"); }
      } catch { if (!cancelled) setIndexStatus("error"); }
    }
    void loadNames();
    return () => { cancelled = true; };
  }, [retryIndex]);

  function selectSuggestion(name: string) { setQuery(name); setSuggestionsOpen(false); setHighlighted(-1); setError(""); }

  function updateTeam(next: TeamMember[]) { sessionTeam = next; setTeam(next); }

  async function addMember() {
    if (busy.current || team.length >= 6) return;
    const name = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) { setError("Enter a Pokémon name or Pokédex number first."); return; }
    busy.current = true;
    setSuggestionsOpen(false);
    setLoading(true);
    setError("");
    try {
      const member = await loadMember(name);
      if (team.some(item => item.id === member.id)) { setError(`${pretty(member.name)} is already on your team.`); return; }
      updateTeam([...team, member]);
      setQuery("");
    } catch (e) {
      setError(e instanceof Error && e.message.startsWith("Poké") ? e.message : "Could not load Pokémon. Check your connection and try again.");
    } finally { busy.current = false; setLoading(false); }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.back}>
          <Text style={styles.link}>← Pokémon list</Text>
        </Pressable>
        <Text style={styles.eyebrow}>MINIDEX / TEAM LAB</Text>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Build your team.</Text>
          <Text style={styles.count}>{team.length} / 6</Text>
        </View>
        <Text style={styles.subtitle}>Choose your favorites. Find their strengths. Cover their weaknesses.</Text>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Add a Pokémon</Text>
          <Text style={styles.body}>Use an exact name or number, such as pikachu, mr-mime, or 25.</Text>
          <View style={styles.searchRow}>
            <TextInput accessibilityLabel="Pokémon name or number" accessibilityHint="Matching names appear below. Select a name, then tap Add." placeholder="e.g. bulbasaur" placeholderTextColor="#7A8596" value={query}
              onChangeText={value => { setQuery(value); setSuggestionsOpen(true); setHighlighted(-1); setError(""); }}
              onFocus={() => setSuggestionsOpen(true)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Escape") { setSuggestionsOpen(false); setHighlighted(-1); }
                if (nativeEvent.key === "ArrowDown") { setSuggestionsOpen(true); setHighlighted(current => Math.min(current + 1, suggestions.length - 1)); }
                if (nativeEvent.key === "ArrowUp") setHighlighted(current => Math.max(current - 1, 0));
              }}
              autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => {
                if (suggestionsOpen && highlighted >= 0 && suggestions[highlighted]) selectSuggestion(suggestions[highlighted].name);
                else void addMember();
              }}
              editable={!loading && team.length < 6} style={styles.input} />
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading || team.length === 6 }} disabled={loading || team.length === 6}
              onPress={addMember} style={({ pressed }) => [styles.button, (loading || team.length === 6 || pressed) && styles.dim]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{team.length === 6 ? "Full" : "+ Add"}</Text>}
            </Pressable>
          </View>
          {suggestionsOpen && query.trim() && !loading && team.length < 6 ? <View style={styles.dropdown}>
            {indexStatus === "loading" ? <Text style={styles.suggestionStatus}>Loading Pokémon names…</Text> :
              indexStatus === "error" ? <View style={{ padding: 12, gap: 8 }}><Text style={styles.body}>Suggestions could not load. You can still add an exact name or number.</Text><Pressable accessibilityRole="button" onPress={() => setRetryIndex(current => current + 1)}><Text style={styles.link}>Retry suggestions</Text></Pressable></View> :
                suggestions.length ? suggestions.map((item, i) => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={`Select ${pretty(item.name)}`} accessibilityState={{ selected: highlighted === i }}
                  onPress={() => selectSuggestion(item.name)} style={({ pressed }) => [styles.suggestion, (pressed || highlighted === i) && { backgroundColor: "#E7F0EF" }]}>
                  <Text style={styles.suggestionName}>{pretty(item.name)}</Text><Text style={styles.body}>#{item.url.split("/").filter(Boolean).pop()}</Text>
                </Pressable>) : <Text style={styles.suggestionStatus}>No available Pokémon match. Try another name or number.</Text>}
          </View> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {team.length === 6 ? <Text style={styles.body}>Team complete. Remove a member to try another Pokémon.</Text> : null}
        </View>

        <View style={styles.cards}>
          {Array.from({ length: 6 }, (_, index) => {
            const member = team[index];
            if (!member) return <View key={`empty-${index}`} style={[styles.card, styles.empty]}><Text style={styles.slot}>0{index + 1}</Text><Text style={styles.body}>Open team slot</Text></View>;
            const weaknesses = analysis.matchups.filter(row => damageMultiplier(member, row.type) > 1);
            return <View key={member.id} style={styles.card}>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>#{String(member.id).padStart(3, "0")}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${pretty(member.name)}`} disabled={loading} onPress={() => { updateTeam(team.filter(item => item.id !== member.id)); setError(""); }} style={styles.remove}>
                  <Text style={styles.link}>Remove</Text>
                </Pressable>
              </View>
              <View style={[styles.spriteStage, { backgroundColor: hexToRgba(typeColor(member.types[0]), 0.12) }]}>
                {member.sprite ? <Image accessibilityLabel={pretty(member.name)} source={{ uri: member.sprite }} style={styles.sprite} /> : <Text style={styles.slot}>?</Text>}
              </View>
              <Text style={styles.memberName}>{pretty(member.name)}</Text>
              {member.stats.map((value, i) => <Stat key={STAT_NAMES[i]} label={STAT_LABELS[i]} value={value} />)}
              <Text style={styles.total}>Base stat total · {member.stats.reduce((sum, value) => sum + value, 0)}</Text>
              <Text style={styles.body}>Weak to: {weaknesses.length ? weaknesses.map(row => `${pretty(row.type)} ×${damageMultiplier(member, row.type)}`).join(", ") : "none"}</Text>
              <View style={styles.heading}>
                <View style={[styles.badges, { flex: 1 }]}>{member.types.map(type => <TypeBadge key={type} type={type} />)}</View>
                <FavoriteButton pokemon={{ name: member.name, url: `https://pokeapi.co/api/v2/pokemon/${member.id}/`, front: member.sprite, types: member.types }} />
              </View>
            </View>;
          })}
        </View>

        {team.length > 0 ? <>
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Team stats & battle potential</Text>
            <Text style={styles.body}>Average base stats across {team.length} {team.length === 1 ? "member" : "members"}.</Text>
            {analysis.averages.map((value, i) => <Stat key={STAT_NAMES[i]} label={STAT_LABELS[i]} value={value} />)}
            <View style={styles.divider} />
            <Text style={styles.insight}>{analysis.physical} physical-leaning · {analysis.special} special-leaning · {team.length - analysis.physical - analysis.special} mixed</Text>
            <Text style={styles.body}>{analysis.physical && analysis.special ? "Both attacking styles are represented." : "Consider both physical and special attackers for more options."} {analysis.averages[5] < 80 ? "Average Speed is below 80; consider a faster teammate or speed control." : "Average Speed is at least 80, giving you a faster starting point."}</Text>
            <Text style={styles.insight}>Potential coverage · {analysis.coverage.size} / 18 types</Text>
            <View style={styles.badges}>{Array.from(analysis.coverage).map(type => <TypeBadge key={type} type={type} />)}</View>
            <Text style={styles.body}>Types your team could hit super effectively using attacks matching its own types, against single-type opponents. Moves are not selected here.</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Compatibility & defensive coverage</Text>
            <Text style={styles.body}>Weak = members taking more than ×1 damage. Resist = members taking less than ×1, including immunities.</Text>
            <Text style={styles.insight}>{analysis.shared.length} shared {analysis.shared.length === 1 ? "weakness" : "weaknesses"} · {analysis.unprotected.length} unprotected {analysis.unprotected.length === 1 ? "type" : "types"}</Text>
            <Text style={styles.body}>{analysis.unprotected.length ? `Consider a teammate that resists ${analysis.unprotected.map(row => pretty(row.type)).join(", ")}.` : "Every current weakness has at least one teammate that resists that type."}</Text>
            <View style={styles.tableRow}><Text style={styles.typeCell}>Incoming type</Text><Text style={styles.numberCell}>Weak</Text><Text style={styles.numberCell}>Resist</Text></View>
            {analysis.matchups.map(row => <View key={row.type} style={styles.tableRow}>
              <View style={styles.typeCell}><TypeBadge type={row.type} /></View>
              <Text style={[styles.numberCell, row.weak.length >= 2 && styles.error]}>{row.weak.length}</Text>
              <Text style={styles.numberCell}>{row.resists.length}</Text>
            </View>)}
          </View>
          <Text style={styles.footnote}>A starting point for planning, not a win prediction. Uses current type matchups and base stats from PokéAPI; abilities, moves, items, levels, EVs, IVs, natures, and format rules are not included.</Text>
        </> : <View style={styles.panel}><Text style={styles.sectionTitle}>Your strategy starts with one Pokémon.</Text><Text style={styles.body}>Add a member to see stats, type coverage, and team compatibility.</Text></View>}
      </View>
    </ScrollView>
  );
}

function pretty(name: string) { return name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "); }
function TypeBadge({ type }: { type: string }) {
  return <View style={[styles.badge, { backgroundColor: hexToRgba(typeColor(type), 0.22) }]}><Text style={styles.badgeText}>{pretty(type)}</Text></View>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.statRow}><Text style={styles.statLabel}>{label}</Text><View style={styles.track}><View style={[styles.fill, { width: `${Math.min(value / 255, 1) * 100}%` }]} /></View><Text style={styles.statNumber}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F7FB" },
  scroll: { padding: 16, paddingTop: 32, paddingBottom: 48, alignItems: "center" },
  page: { width: "100%", maxWidth: 1100, gap: 20 },
  back: { alignSelf: "flex-start", paddingVertical: 8 },
  link: { color: "#315D65", fontWeight: "600", fontSize: 14 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, color: "#687386" },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "#1C2636", flexShrink: 1 },
  count: { fontSize: 18, color: "#315D65", fontWeight: "700" },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#687386" },
  panel: { backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#D6DFEA", padding: 20, gap: 12 },
  sectionTitle: { color: "#1C2636", fontSize: 19, fontWeight: "700" },
  body: { color: "#586678", fontSize: 13, lineHeight: 21 },
  searchRow: { flexDirection: "row", gap: 10 },
  dropdown: { borderWidth: 1, borderColor: "#D6DFEA", borderRadius: 8, overflow: "hidden", marginTop: -8, backgroundColor: "#FFF" },
  suggestion: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#EEF2F6" },
  suggestionName: { color: "#1C2636", fontSize: 14, flexShrink: 1 },
  suggestionStatus: { padding: 12, color: "#687386", fontSize: 13 },
  input: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: "#D6DFEA", borderRadius: 8, padding: 12, color: "#1C2636", fontSize: 15 },
  button: { backgroundColor: "#315D65", paddingHorizontal: 20, borderRadius: 8, minHeight: 46, justifyContent: "center" },
  buttonText: { color: "white", fontSize: 14, fontWeight: "700" },
  dim: { opacity: 0.5 },
  error: { color: "#B33D37", fontSize: 13, lineHeight: 20 },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { flexGrow: 1, flexBasis: 285, maxWidth: "100%", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#D6DFEA", backgroundColor: "#FFF", gap: 10 },
  empty: { minHeight: 145, borderStyle: "dashed", backgroundColor: "transparent", justifyContent: "center", alignItems: "center" },
  slot: { fontSize: 30, color: "#A6B2C2", fontWeight: "300" },
  remove: { paddingVertical: 8, paddingLeft: 8 },
  spriteStage: { height: 115, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sprite: { height: 110, width: 110, resizeMode: "contain" },
  memberName: { fontSize: 20, fontWeight: "700", color: "#1C2636" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, alignSelf: "flex-start" },
  badgeText: { color: "#263345", fontWeight: "600", fontSize: 11 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { width: 55, color: "#586678", fontSize: 12 },
  track: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#E8EEF5", overflow: "hidden" },
  fill: { backgroundColor: "#518A89", height: "100%", borderRadius: 4 },
  statNumber: { width: 28, textAlign: "right", color: "#1C2636", fontSize: 12, fontWeight: "600" },
  total: { fontWeight: "600", color: "#315D65", fontSize: 12, marginTop: 4 },
  divider: { height: 1, backgroundColor: "#E8EEF5", marginVertical: 4 },
  insight: { color: "#1C2636", fontSize: 14, fontWeight: "600", lineHeight: 22 },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#EEF2F6", paddingVertical: 7 },
  typeCell: { flex: 1, color: "#586678", fontSize: 12 },
  numberCell: { width: 58, textAlign: "center", color: "#315D65", fontSize: 13, fontWeight: "600" },
  footnote: { color: "#687386", fontSize: 12, lineHeight: 20 },
});
