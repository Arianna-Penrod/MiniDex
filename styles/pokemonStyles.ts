import { StyleSheet } from "react-native";

// styles for the pokemon cards on the home page
export const pokemonStyles = StyleSheet.create({
    list: {
        padding: 12,
    },
    row: {
        marginBottom: 10,
    },
    card: {
        borderRadius: 14,
        overflow: "hidden",
    },
    cardInner: {
        padding: 10,
        // backgroundColor: "rgba(255,255,255,0.65)", // soft overlay so sprites pop from bg
        alignItems: "center", // align at center
    },
    name: {
        fontWeight: "700",
        textTransform: "capitalize",
        textAlign: "center",
        marginBottom: 6,
    },
    spriteWrap: {
        alignItems: "center",
        justifyContent: "center",
        height: 96,
    },
    sprite: {
        width: 80,
        height: 80,
    },
    types: {
        marginTop: 4,
        fontSize: 12,
        opacity: 0.8,
        textAlign: "center",
    },
});
