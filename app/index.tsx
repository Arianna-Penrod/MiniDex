import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

//stored the different pokemon types
type PokemonType =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

// assign colors to each type
const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};
// plus fallback in case of an unknown type
function typeColor(t?: string) {
  return (t && TYPE_COLORS[t]) || "#DDD"; // fallback
}

// create an interface to define the structure of the pokemon data
interface Pokemon {
  name: string;
  url: string;
  front: string;
  back: string;
  shinyFront: string;
  shinyBack: string;
  types: string[];
}

// this will run like a main func
export default function Index() {
  // get pokemon data and set it to state
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);

  // fetch mons from API
  useEffect(() => {
    fetchMons();
  }, []);


  // get pokemon data
  async function fetchMons() {
    try {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=150");
      const data = await res.json(); // store response as json

      const details = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const result = await fetch(pokemon.url); // fetch details for each pokemon
          const detail = await result.json(); // return the details as json
          return {
            name: pokemon.name,
            url: pokemon.url,
            front: detail.sprites.front_default, // get the sprite
            back: detail.sprites.back_default, // get the back sprite
            shinyFront: detail.sprites.front_shiny, // get the shiny sprite
            shinyBack: detail.sprites.back_shiny,
            types: detail.types.map((typeInfo: any) => typeInfo.type.name), // get types and join them as a string
          };
        })
      )
      setPokemons(details); // get mons from API
    } catch (e) { // log if err
      console.error(e);
    }
  }

  // create a card component to display each pokemon (move this to components later)
  function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
    // separate the types arr into 2
    const [t1, t2] = pokemon.types;
    const c1 = typeColor(t1); // get first type
    const c2 = typeColor(t2); // get second type

    // display the pokemon data in a card with the type colors as background
    const content = (
      <View style={styles.cardInner}>
        {/* display the name and types of the pokemon */}
        <Text style={styles.name}>{pokemon.name}</Text>
        <Text style={styles.types}>Types: {pokemon.types.join(", ")}</Text>

        {/* display th back & front pokemon sprites */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {pokemon.front ? (
            <Image source={{ uri: pokemon.front }} style={styles.sprite} />
          ) : null}
          {pokemon.back ? (
            <Image source={{ uri: pokemon.back }} style={styles.sprite} />
          ) : null}
        </View>
      </View>
    );

    // 1 type = solid background
    if (!t2) {
      return <View style={[styles.card, { backgroundColor: c1 }]}>{content}</View>;
    }

    // 2 types = diagonal split background (hard split)
    return (
      <LinearGradient
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={[c1, c1, c2, c2]}
        locations={[0, 0.35, 0.65, 1]}
      >
        {content}
      </LinearGradient>


    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Pokemon List</Text>
      {/* iterate through the mons and display them */}
      {pokemons.map((pokemon) => (
        <PokemonCard key={pokemon.name} pokemon={pokemon} />
      ))}
    </ScrollView>
  );
}

// set style for the card content
const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  cardInner: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  types: {
    marginTop: 4,
    marginBottom: 8,
  },
  sprite: {
    width: 96,
    height: 96,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
  },
});

