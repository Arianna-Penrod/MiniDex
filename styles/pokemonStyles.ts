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
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 212,
        borderWidth: 1,
        borderColor: "rgba(28,38,54,0.08)",
    },
    cardInner: {
        padding: 10,
        gap: 8,
    },
    headingRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        justifyContent: "space-between",
        minHeight: 22,
    },
    name: {
        color: "#1C2636",
        flex: 1,
        fontWeight: "700",
        textTransform: "capitalize",
    },
    number: {
        color: "#526070",
        fontSize: 12,
        fontWeight: "700",
    },
    spriteWrap: {
        alignItems: "center",
        aspectRatio: 1.15,
        backgroundColor: "#FFF",
        borderRadius: 8,
        justifyContent: "center",
        width: "100%",
    },
    sprite: {
        height: "84%",
        width: "84%",
    },
    typeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        minHeight: 24,
    },
    typePill: {
        borderRadius: 8,
        minHeight: 24,
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    typeText: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
});
