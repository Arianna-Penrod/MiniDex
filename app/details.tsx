import { Pokemon } from "@/types/pokemon";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export default function Details() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [pokemon, setPokemon] = useState<Pokemon | null>(null);

    useEffect(() => {
        async function fetchMon() {
            try {
                if (!id) return;

                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                const data = await res.json();

                const p: Pokemon = {
                    name: data.name,
                    url: data.species?.url ?? "",
                    front: data.sprites?.front_default,
                    back: data.sprites?.back_default,
                    shinyFront: data.sprites?.front_shiny,
                    shinyBack: data.sprites?.back_shiny,
                    types: data.types?.map((t: any) => t.type.name) ?? [],
                };

                setPokemon(p);
            } catch (e) {
                console.error(e);
            }
        }

        fetchMon();
    }, [id]);

    return (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "700" }}>
                Pokemon Details for ID: {id}
            </Text>

            {pokemon ? (
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 18, textTransform: "capitalize" }}>{pokemon.name}</Text>
                    <Text>Types: {pokemon.types.join(", ")}</Text>

                    {pokemon.front ? (
                        <Image
                            source={{ uri: pokemon.front }}
                            style={{ width: 180, height: 180, alignSelf: "center", marginTop: 12 }}
                            resizeMode="contain"
                        />
                    ) : null}
                </View>
            ) : (
                <Text style={{ marginTop: 12 }}>Loading...</Text>
            )}
        </ScrollView>
    );
}
