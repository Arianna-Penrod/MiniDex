import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, View } from "react-native";
import { pokemonStyles as styles } from "../styles/pokemonStyles";
import { Pokemon } from "../types/pokemon";
import { hexToRgba, typeColor } from "../utils/typeColors";

const BG_ALPHA = 0.30;

export function PokeCard({ pokemon, width }: { pokemon: Pokemon; width: number }) {
    // split pokemon types into 2
    const [t1, t2] = pokemon.types;
    const c1 = hexToRgba(typeColor(t1), BG_ALPHA); // type 1
    const c2 = hexToRgba(typeColor(t2), BG_ALPHA); // type 2
    const id = getIdFromUrl(pokemon.url);

    // get the content like name, types, and sprite to display on home page
    const content = (

        <View style={styles.cardInner}>
            <View style={styles.headingRow}>
                {/* name */}
                <Text style={styles.name} numberOfLines={1}>
                    {pokemon.name}
                </Text>
                <Text style={styles.number}>#{id.padStart(3, "0")}</Text>
            </View>
            {/* sprite*/}
            <View style={styles.spriteWrap}>
                {pokemon.front ? (
                    <Image source={{ uri: pokemon.front }} style={styles.sprite} resizeMode="contain" />
                ) : null}
            </View>
            {/* pokemon types */}
            <View style={styles.typeRow}>
                {pokemon.types.map((type) => (
                    <View key={type} style={[styles.typePill, { backgroundColor: typeColor(type) }]}>
                        <Text style={styles.typeText} numberOfLines={1}>
                            {type}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );

    // 1 type -> solid background
    if (!t2) {
        return <View style={[styles.card, { width, backgroundColor: c1 }]}>{content}</View>;
    }

    // 2 types -> diagonal fade (thank you chat)
    return (
        <LinearGradient
            style={[styles.card, { width }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={[c1, c2]}
        >
            {content}
        </LinearGradient>
    );
}

function getIdFromUrl(url: string) {
    return url.split("/").filter(Boolean).pop() || "0";
}
