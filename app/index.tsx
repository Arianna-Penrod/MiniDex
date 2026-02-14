import { useEffect } from "react";
import { Text, View } from "react-native";

export default function Index() {

  useEffect(() => {
    fetchMons();
  }, []);


  // get pokemon data
  async function fetchMons() {
    try {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=15");
      const data = await res.json();
      console.log(data);
    } catch (e) { // log if err
      console.error(e);
    }
  }

  // render the app
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>MiniDex</Text>
    </View>
  );
}
