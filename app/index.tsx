import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

// this will run like a main func
export default function Index() {

  interface Pokemon {
    name: string;
    url: string;
  }

  const [pokemons, setPokemons] = useState<Pokemon[]>([]); // state to hold pokemon data as an array

  // fetch mons from API
  useEffect(() => {
    fetchMons();
  }, []);


  // get pokemon data
  async function fetchMons() {
    try {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=15");
      const data = await res.json(); // store response as json
      setPokemons(data.results); // get mons from API
    } catch (e) { // log if err
      console.error(e);
    }
  }

  // render the app
  return (
    <ScrollView>
      <Text>Pokemon List</Text>
      // iterate through mons and display their names
      {pokemons.map((pokemon, index) => (
        <View key={index}>
          <Text>{pokemon.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
