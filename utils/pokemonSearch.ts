import { Pokemon } from "@/types/pokemon";

type Named = { name: string; url: string };
export type SearchPokemon = Pokemon & { hp: number; attack: number; specialAttack: number };
export type SearchFilters = {
  type: string; hpMin: string; hpMax: string; damageMin: string; damageMax: string;
  damageStat: "attack" | "specialAttack"; move: string; species: string;
};
export const EMPTY_FILTERS: SearchFilters = { type: "", hpMin: "", hpMax: "", damageMin: "", damageMax: "", damageStat: "attack", move: "", species: "" };
export const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");

const resources = new Map<string, Promise<unknown>>();
async function resource<T>(path: string): Promise<T> {
  let request = resources.get(path);
  if (!request) {
    request = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/${path}`, { signal: controller.signal });
        if (response.status === 404) {
          const label = path.startsWith("move/") ? "move" : path.startsWith("pokemon-species/") ? "species" : "Pokémon";
          throw new Error(`No ${label} found for “${decodeURIComponent(path.split("/").pop() ?? "") }”. Use an exact name or number.`);
        }
        if (!response.ok) throw new Error("PokéAPI is unavailable. Please try again.");
        return await response.json();
      } finally { clearTimeout(timeout); }
    })();
    resources.set(path, request);
    request.catch(() => resources.delete(path));
  }
  return request as Promise<T>;
}

export function validateFilters(filters: SearchFilters): string {
  for (const [label, min, max] of [["HP", filters.hpMin, filters.hpMax], ["Attack", filters.damageMin, filters.damageMax]]) {
    if ([min, max].some(value => value !== "" && (!/^\d+$/.test(value) || Number(value) > 255))) return `${label} must be a whole number from 0 to 255.`;
    if (min !== "" && max !== "" && Number(min) > Number(max)) return `${label} minimum must be less than or equal to its maximum.`;
  }
  return "";
}

export function matchesStats(pokemon: SearchPokemon, filters: SearchFilters) {
  const inRange = (value: number, min: string, max: string) => (min === "" || value >= Number(min)) && (max === "" || value <= Number(max));
  return inRange(pokemon.hp, filters.hpMin, filters.hpMax)
    && inRange(pokemon[filters.damageStat], filters.damageMin, filters.damageMax);
}

// Narrow the complete index with API membership lists before fetching stats.
export async function searchCandidates(query: string, filters: SearchFilters): Promise<Named[]> {
  const [index, typed, moved, species] = await Promise.all([
    resource<{ results: Named[] }>("pokemon?limit=100000&offset=0"),
    filters.type ? resource<{ pokemon: { pokemon: Named }[] }>(`type/${filters.type}`) : null,
    normalizeName(filters.move) ? resource<{ learned_by_pokemon: Named[] }>(`move/${encodeURIComponent(normalizeName(filters.move))}`) : null,
    normalizeName(filters.species) ? resource<{ varieties: { pokemon: Named }[] }>(`pokemon-species/${encodeURIComponent(normalizeName(filters.species))}`) : null,
  ]);
  const membership = [typed?.pokemon.map(item => item.pokemon), moved?.learned_by_pokemon, species?.varieties.map(item => item.pokemon)]
    .filter((list): list is Named[] => list !== undefined).map(list => new Set(list.map(item => item.name)));
  const name = normalizeName(query);
  return index.results.filter(item => (!name || item.name.includes(name) || item.url.split("/").filter(Boolean).pop() === name)
    && membership.every(set => set.has(item.name)));
}

async function searchPokemon(item: Named): Promise<SearchPokemon> {
  const id = item.url.split("/").filter(Boolean).pop();
  const data = await resource<{
    name: string; sprites: { front_default: string | null; back_default: string | null; front_shiny: string | null; back_shiny: string | null };
    types: { type: { name: string } }[]; stats: { stat: { name: string }; base_stat: number }[];
  }>(`pokemon/${id}`);
  const stat = (name: string) => data.stats.find(item => item.stat.name === name)?.base_stat ?? 0;
  return { name: data.name, url: item.url, front: data.sprites.front_default, back: data.sprites.back_default,
    shinyFront: data.sprites.front_shiny, shinyBack: data.sprites.back_shiny, types: data.types.map(item => item.type.name),
    hp: stat("hp"), attack: stat("attack"), specialAttack: stat("special-attack") };
}

export type SearchSession = { candidates: Named[]; cursor: number; filters: SearchFilters };
export async function searchPage(session: SearchSession, cancelled: () => boolean) {
  const found: SearchPokemon[] = [];
  let cursor = session.cursor;
  const end = Math.min(cursor + 120, session.candidates.length);
  while (cursor < end && found.length < 24 && !cancelled()) {
    // Six requests at a time; never skip matching entries at page boundaries.
    const size = Math.min(6, 24 - found.length, end - cursor);
    const batch = await Promise.all(session.candidates.slice(cursor, cursor + size).map(searchPokemon));
    if (cancelled()) return { found: [], cursor: session.cursor };
    found.push(...batch.filter(pokemon => matchesStats(pokemon, session.filters)));
    cursor += size;
  }
  return { found, cursor };
}
