// import stuff from react and react native
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

// import from our utils and types
import { PokeCard } from "@/components/PokeCard";
import { Pokemon } from "../types/pokemon";

// store mons names and url for the searching function
type PokemonIndexItem = {
  name: string;
  url: string;
};

// constants
const GAP = 12;
const PADDING = 16;
const PAGE_SIZE = 50;
const MAX_CONTENT_WIDTH = 1180;
const SEARCH_RESULT_LIMIT = 30;

// this will run like a main func
export default function Index() {
  const { width: windowWidth } = useWindowDimensions();
  // get pokemon data and set it to state
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  // for search query get list of all pokemon names and url
  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndexItem[]>([]);
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pokemonCache = useRef<Record<string, Pokemon>>({});

  const numColumns = getColumnCount(windowWidth);
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const cardWidth =
    (contentWidth - PADDING * 2 - GAP * (numColumns - 1)) / numColumns;

  // fetch mons from API
  useEffect(() => {
    fetchMons(0, true);
    fetchPokemonIndex();
  }, []);

  // get all pokemon names and urls fr searching function as endpoint
  async function fetchPokemonIndex() {
    try {
      const res = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0",
      );
      const data = await res.json();

      setPokemonIndex(data.results);
    } catch (e) {
      console.error(e);
    }
  }

  function buildPokemon(pokemon: any, detail: any): Pokemon {
    return {
      name: pokemon.name,
      url: pokemon.url,
      front: detail.sprites.front_default, // get the sprite
      back: detail.sprites.back_default, // get the back sprite
      shinyFront: detail.sprites.front_shiny, // get the shiny sprite
      shinyBack: detail.sprites.back_shiny,
      types: detail.types.map((typeInfo: any) => typeInfo.type.name), // get types
    };
  }

  async function fetchPokemonDetails(pokemon: PokemonIndexItem) {
    const cachedPokemon = pokemonCache.current[pokemon.name];

    if (cachedPokemon) {
      return cachedPokemon;
    }

    const result = await fetch(pokemon.url); // fetch details for each pokemon
    const detail = await result.json(); // return the details as json
    const fullPokemon = buildPokemon(pokemon, detail);
    pokemonCache.current[pokemon.name] = fullPokemon;

    return fullPokemon;
  }

  // get pokemon data
  async function fetchMons(offset: number, reset: boolean = false) {
    if (loadingMore) return;
    if (!hasMore && !reset) return;

    try {
      setLoadingMore(true);
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const data = await res.json(); // store response as json

      const details = await Promise.all(
        data.results.map((pokemon: PokemonIndexItem) =>
          fetchPokemonDetails(pokemon),
        ),
      );
      setPokemons((prev) => (reset ? details : [...prev, ...details]));
      setOffset(offset + PAGE_SIZE);
      setHasMore(Boolean(data.next)); //
    } catch (e) {
      // log if err
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  // helper to get url id
  function getIdFromUrl(url: string) {
    // example: https://pokeapi.co/api/v2/pokemon/25/
    return url.split("/").filter(Boolean).pop()!;
  }

  function loadMore() {
    // optional: disable infinite scroll while user is searching
    if (query.trim()) return;

    fetchMons(offset);
  }
  // search through pokemon for search bar
  const trimmedQuery = query.trim().toLowerCase();

  const filteredPokemonIndex = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }

    return pokemonIndex
      .filter((p) => p.name.toLowerCase().includes(trimmedQuery))
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [pokemonIndex, trimmedQuery]);

  useEffect(() => {
    let ignoreSearch = false;

    async function fetchSearchResults() {
      if (!trimmedQuery) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      try {
        setSearching(true);
        const details = await Promise.all(
          filteredPokemonIndex.map((pokemon) => fetchPokemonDetails(pokemon)),
        );

        if (!ignoreSearch) {
          setSearchResults(details);
        }
      } catch (e) {
        if (!ignoreSearch) {
          setSearchResults([]);
        }

        console.error(e);
      } finally {
        if (!ignoreSearch) {
          setSearching(false);
        }
      }
    }

    fetchSearchResults();

    return () => {
      ignoreSearch = true;
    };
  }, [filteredPokemonIndex, trimmedQuery]);

  const visiblePokemon = trimmedQuery ? searchResults : pokemons;

  // show each pokemon on a PokeCard
  return (
    <View style={styles.screen}>
      {/* Screen title */}
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon List</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Pokemon by name..."
          autoCapitalize="none"
          style={styles.searchInput}
        />
      </View>

      {/* row with 3 mons each */}
      <FlatList
        key={`pokemon-grid-${numColumns}`}
        style={styles.list}
        data={visiblePokemon}
        keyExtractor={(p) => p.name}
        numColumns={numColumns}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          (!trimmedQuery && loadingMore) || searching ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={
          trimmedQuery && !searching ? (
            <Text style={styles.emptyText}>No Pokemon found.</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={
          numColumns > 1 ? styles.columnWrapper : undefined
        }
        renderItem={({ item }) => {
          const id = getIdFromUrl(item.url);

          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/details", params: { id } })
              }
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <PokeCard pokemon={item} width={cardWidth} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function getColumnCount(width: number) {
  if (width >= 1100) return 5;
  if (width >= 820) return 4;
  if (width >= 600) return 3;
  if (width >= 340) return 2;

  return 1;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  header: {
    alignSelf: "center",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: PADDING,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    color: "#1C2636",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D6DFEA",
    borderRadius: 8,
    color: "#1C2636",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  list: {
    alignSelf: "center",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
  },
  listContent: {
    padding: PADDING,
  },
  columnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  emptyText: {
    color: "#687386",
    fontSize: 15,
    paddingTop: 24,
    textAlign: "center",
  },
});
