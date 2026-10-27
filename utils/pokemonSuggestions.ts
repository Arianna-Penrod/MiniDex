export type PokemonName = { name: string; url: string };

export function pokemonSuggestions(index: PokemonName[], query: string, excluded: string[]) {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, "-");
  if (!normalized) return [];
  return index.filter(item => !excluded.includes(item.name) && (
    item.name.includes(normalized) || item.url.split("/").filter(Boolean).pop() === normalized
  )).sort((a, b) => Number(b.name.startsWith(normalized)) - Number(a.name.startsWith(normalized))
    || a.name.localeCompare(b.name)).slice(0, 8);
}
