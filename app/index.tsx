// import stuff from react and react native
import { useEffect, useState } from "react";
import { Dimensions, FlatList, Text, View } from "react-native";

// import from our utils and types
import { PokeCard } from "@/components/PokeCard";
import { Pokemon } from "../types/pokemon";


const GAP = 10;
const PADDING = 12;
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - PADDING * 2 - GAP * 2) / 3;

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
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
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

  // show each pokemon on a PokeCard
  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", padding: 12 }}>Pokemon List</Text>

      <FlatList
        style={{ flex: 1 }}
        data={pokemons}
        keyExtractor={(p) => p.name}
        numColumns={3}
        contentContainerStyle={{ padding: PADDING }}
        columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
        renderItem={({ item }) => <PokeCard pokemon={item} width={CARD_W} />}
      />
    </View>
  );
}

