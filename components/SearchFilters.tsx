import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BATTLE_TYPES } from "@/utils/teamAnalysis";
import { SearchFilters as Filters } from "@/utils/pokemonSearch";

export function SearchFilters({ value, onChange, onApply, onClear, error }: {
  value: Filters; onChange: (value: Filters) => void; onApply: () => void; onClear: () => void; error: string;
}) {
  const update = (key: keyof Filters, next: string) => onChange({ ...value, [key]: next });
  return <View style={styles.panel}>
    <Text style={styles.label}>Type</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
      {["", ...BATTLE_TYPES].map(type => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: value.type === type }}
        onPress={() => update("type", type)} style={[styles.chip, value.type === type && styles.selected]}>
        <Text style={[styles.chipText, value.type === type && styles.selectedText]}>{type || "All types"}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={styles.fields}>
      <View style={styles.field}><Text style={styles.label}>Base HP</Text><Range label="HP" min={value.hpMin} max={value.hpMax} onMin={v => update("hpMin", v)} onMax={v => update("hpMax", v)} /></View>
      <View style={styles.field}><Text style={styles.label}>Damage potential · base stat</Text>
        <View style={styles.chips}>{(["attack", "specialAttack"] as const).map(stat => <Pressable key={stat} accessibilityRole="button" accessibilityState={{ selected: value.damageStat === stat }} onPress={() => update("damageStat", stat)} style={[styles.chip, value.damageStat === stat && styles.selected]}><Text style={[styles.chipText, value.damageStat === stat && styles.selectedText]}>{stat === "attack" ? "Attack" : "Sp. Atk"}</Text></Pressable>)}</View>
        <Range label={value.damageStat === "attack" ? "Attack" : "Special Attack"} min={value.damageMin} max={value.damageMax} onMin={v => update("damageMin", v)} onMax={v => update("damageMax", v)} />
      </View>
      <View style={styles.field}><Text style={styles.label}>Attacks / moves</Text><TextInput accessibilityLabel="Move name or number" placeholder="e.g. thunderbolt" placeholderTextColor="#7A8596" value={value.move} onChangeText={v => update("move", v)} autoCapitalize="none" autoCorrect={false} style={styles.input} /></View>
      <View style={styles.field}><Text style={styles.label}>Species</Text><TextInput accessibilityLabel="Species name or number" placeholder="e.g. pikachu or 25" placeholderTextColor="#7A8596" value={value.species} onChangeText={v => update("species", v)} autoCapitalize="none" autoCorrect={false} style={styles.input} /></View>
    </View>
    <Text style={styles.help}>Use exact move and species names (spaces or hyphens work). Species includes alternate forms. Moves include learnsets across games; availability varies by game. Attack stats describe potential, not battle damage.</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.chips}><Pressable accessibilityRole="button" onPress={onApply} style={[styles.chip, styles.selected]}><Text style={styles.selectedText}>Apply filters</Text></Pressable><Pressable accessibilityRole="button" onPress={onClear} style={styles.chip}><Text style={styles.chipText}>Clear filters</Text></Pressable></View>
  </View>;
}

function Range({ label, min, max, onMin, onMax }: { label: string; min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void }) {
  return <View style={styles.chips}><TextInput accessibilityLabel={`Minimum ${label}`} placeholder="Min (0)" placeholderTextColor="#7A8596" keyboardType="number-pad" value={min} onChangeText={onMin} style={[styles.input, { flex: 1 }]} /><TextInput accessibilityLabel={`Maximum ${label}`} placeholder="Max (255)" placeholderTextColor="#7A8596" keyboardType="number-pad" value={max} onChangeText={onMax} style={[styles.input, { flex: 1 }]} /></View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: "#FFF", borderColor: "#D6DFEA", borderWidth: 1, borderRadius: 8, padding: 14, gap: 12 },
  label: { color: "#1C2636", fontSize: 13, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 8, alignItems: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#EEF3F8", minHeight: 40, justifyContent: "center" },
  selected: { backgroundColor: "#315D65" },
  chipText: { color: "#315D65", fontSize: 12, textTransform: "capitalize" },
  selectedText: { color: "#FFF", fontSize: 12 },
  fields: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  field: { flexBasis: 220, flexGrow: 1, gap: 8 },
  input: { minWidth: 0, borderRadius: 8, borderWidth: 1, borderColor: "#D6DFEA", padding: 10, color: "#1C2636", fontSize: 13, backgroundColor: "#FFF" },
  help: { color: "#687386", fontSize: 12, lineHeight: 18 },
  error: { color: "#B33D37", fontSize: 13 },
});
