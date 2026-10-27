import { PokemonDetails } from "@/types/pokemon";
import { FavoriteButton } from "@/components/FavoriteButton";
import { hexToRgba, typeColor } from "@/utils/typeColors";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

const MAX_CONTENT_WIDTH = 1100;
const STAT_MAX = 255;

type StatKey = keyof PokemonDetails["stats"];

const STAT_KEY_BY_API_NAME: Record<string, StatKey> = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "specialAttack",
    "special-defense": "specialDefense",
    speed: "speed",
};

const STAT_LABELS: Record<StatKey, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    specialAttack: "Sp. Atk",
    specialDefense: "Sp. Def",
    speed: "Speed",
};

export default function Details() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { width } = useWindowDimensions();
    const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
    const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const isWide = width >= 780;

    useEffect(() => {
        let ignoreRequest = false;

        async function fetchMon() {
            try {
                if (!id) return;

                setLoading(true);
                setHasError(false);

                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                const data = await res.json();
                let description = "No description is available yet.";

                if (data.species?.url) {
                    const speciesRes = await fetch(data.species.url);
                    const speciesData = await speciesRes.json();
                    const englishEntry = speciesData.flavor_text_entries?.find(
                        (entry: any) => entry.language?.name === "en",
                    );

                    if (englishEntry?.flavor_text) {
                        description = cleanDescription(englishEntry.flavor_text);
                    }
                }

                const p: PokemonDetails = {
                    name: data.name,
                    url: `https://pokeapi.co/api/v2/pokemon/${data.id}/`,
                    front: data.sprites?.front_default,
                    back: data.sprites?.back_default,
                    shinyFront: data.sprites?.front_shiny,
                    shinyBack: data.sprites?.back_shiny,
                    types: data.types?.map((t: any) => t.type.name) ?? [],
                    description,
                    height: data.height ?? 0,
                    weight: data.weight ?? 0,
                    abilities:
                        data.abilities?.map((abilityInfo: any) =>
                            formatName(abilityInfo.ability.name),
                        ) ?? [],
                    stats: buildStats(data.stats ?? []),
                };

                if (!ignoreRequest) {
                    setPokemon(p);
                    setSelectedSprite(p.front ?? p.shinyFront ?? p.back ?? null);
                }
            } catch (e) {
                if (!ignoreRequest) {
                    setHasError(true);
                    setPokemon(null);
                    setSelectedSprite(null);
                }

                console.error(e);
            } finally {
                if (!ignoreRequest) {
                    setLoading(false);
                }
            }
        }

        fetchMon();

        return () => {
            ignoreRequest = true;
        };
    }, [id]);

    const primaryType = pokemon?.types[0];
    const secondaryType = pokemon?.types[1] ?? primaryType;
    const primaryColor = typeColor(primaryType);
    const secondaryColor = typeColor(secondaryType);
    const mainSprite = selectedSprite ?? pokemon?.front ?? pokemon?.shinyFront ?? pokemon?.back;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
            <View style={styles.page}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed ? styles.pressed : null,
                    ]}
                >
                    <Text style={styles.backIcon}>{"<"}</Text>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>

                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>Loading Pokemon...</Text>
                    </View>
                ) : null}

                {hasError ? (
                    <View style={styles.loadingState}>
                        <Text style={styles.errorTitle}>Pokemon not found</Text>
                        <Text style={styles.errorText}>
                            Try going back and choosing another Pokemon.
                        </Text>
                    </View>
                ) : null}

                {pokemon && !loading ? (
                    <View style={[styles.profile, isWide ? styles.profileWide : null]}>
                        <LinearGradient
                            colors={[
                                hexToRgba(primaryColor, 0.34),
                                hexToRgba(secondaryColor, 0.18),
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.visualPanel, isWide ? styles.visualPanelWide : null]}
                        >
                            <View style={styles.visualHeader}>
                                <Text style={styles.number}>#{formatId(id)}</Text>
                            </View>

                            <View style={styles.spriteStage}>
                                {mainSprite ? (
                                    <Image
                                        source={{ uri: mainSprite }}
                                        style={styles.mainSprite}
                                        resizeMode="contain"
                                    />
                                ) : null}
                            </View>

                            <View style={styles.spriteStrip}>
                                <SpriteTile label="Front" uri={pokemon.front} onPress={setSelectedSprite} />
                                <SpriteTile label="Back" uri={pokemon.back} onPress={setSelectedSprite} />
                                <SpriteTile label="Shiny" uri={pokemon.shinyFront} onPress={setSelectedSprite} />
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }}>
                                <View style={[styles.typeRow, { flex: 1, justifyContent: "flex-start" }]}>
                                    {pokemon.types.map(type => <View key={type} style={[styles.typePill, { backgroundColor: typeColor(type) }]}><Text style={styles.typeText}>{type}</Text></View>)}
                                </View>
                                <FavoriteButton pokemon={pokemon} />
                            </View>
                        </LinearGradient>

                        <View style={[styles.infoPanel, isWide ? styles.infoPanelWide : null]}>
                            <Text style={styles.name}>{formatName(pokemon.name)}</Text>
                            <Text style={styles.description}>{pokemon.description}</Text>

                            <View style={styles.metricGrid}>
                                <Metric label="Height" value={formatHeight(pokemon.height)} />
                                <Metric label="Weight" value={formatWeight(pokemon.weight)} />
                                <Metric label="Types" value={pokemon.types.length.toString()} />
                            </View>

                            <SectionTitle title="Abilities" />
                            <View style={styles.abilityRow}>
                                {pokemon.abilities.map((ability) => (
                                    <View key={ability} style={styles.abilityPill}>
                                        <Text style={styles.abilityText}>{ability}</Text>
                                    </View>
                                ))}
                            </View>

                            <SectionTitle title="Base Stats" />
                            <View style={styles.statsList}>
                                {Object.entries(pokemon.stats).map(([key, value]) => (
                                    <StatBar
                                        key={key}
                                        label={STAT_LABELS[key as StatKey]}
                                        value={value}
                                        color={primaryColor}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

function SpriteTile({
    label,
    uri,
    onPress,
}: {
    label: string;
    uri?: string | null;
    onPress: (uri: string) => void;
}) {
    return (
        <Pressable
            disabled={!uri}
            onPress={() => uri && onPress(uri)}
            style={({ pressed }) => [
                styles.spriteTile,
                pressed ? styles.pressed : null,
            ]}
        >
            <View style={styles.spriteTileImageWrap}>
                {uri ? (
                    <Image source={{ uri }} style={styles.spriteTileImage} resizeMode="contain" />
                ) : null}
            </View>
            <Text style={styles.spriteTileLabel}>{label}</Text>
        </Pressable>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metric}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
}

function SectionTitle({ title }: { title: string }) {
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const percent = Math.min(value / STAT_MAX, 1) * 100;

    return (
        <View style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statTrack}>
                <View
                    style={[
                        styles.statFill,
                        {
                            width: `${percent}%`,
                            backgroundColor: color,
                        },
                    ]}
                />
            </View>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

function buildStats(stats: any[]): PokemonDetails["stats"] {
    const builtStats: PokemonDetails["stats"] = {
        hp: 0,
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
    };

    stats.forEach((statInfo) => {
        const key = STAT_KEY_BY_API_NAME[statInfo.stat?.name];

        if (key) {
            builtStats[key] = statInfo.base_stat;
        }
    });

    return builtStats;
}

function cleanDescription(text: string) {
    return text.replace(/\s+/g, " ").replace(/\f/g, " ").trim();
}

function formatName(name: string) {
    return name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatId(id?: string) {
    return (id ?? "0").padStart(3, "0");
}

function formatHeight(height: number) {
    return `${(height / 10).toFixed(1)} m`;
}

function formatWeight(weight: number) {
    return `${(weight / 10).toFixed(1)} kg`;
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F4F7FB",
    },
    scrollContent: {
        alignItems: "center",
        padding: 16,
    },
    page: {
        maxWidth: MAX_CONTENT_WIDTH,
        width: "100%",
    },
    backButton: {
        alignItems: "center",
        alignSelf: "flex-start",
        flexDirection: "row",
        gap: 6,
        marginBottom: 12,
        minHeight: 38,
        paddingRight: 10,
    },
    backIcon: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 32,
        lineHeight: 34,
    },
    backText: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 15,
        fontWeight: "700",
    },
    pressed: {
        opacity: 0.65,
    },
    loadingState: {
        alignItems: "center",
        gap: 12,
        justifyContent: "center",
        minHeight: 320,
    },
    loadingText: {
        color: "#687386",
        fontFamily: "Courier New",
        fontSize: 15,
    },
    errorTitle: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 22,
        fontWeight: "800",
    },
    errorText: {
        color: "#687386",
        fontFamily: "Courier New",
        fontSize: 15,
        textAlign: "center",
    },
    profile: {
        gap: 16,
    },
    profileWide: {
        alignItems: "stretch",
        flexDirection: "row",
    },
    visualPanel: {
        borderColor: "rgba(28,38,54,0.08)",
        borderRadius: 8,
        borderWidth: 1,
        overflow: "hidden",
        padding: 14,
    },
    visualPanelWide: {
        flex: 0.92,
    },
    visualHeader: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
        marginBottom: 12,
    },
    number: {
        color: "#526070",
        fontFamily: "Courier New",
        fontSize: 16,
        fontWeight: "800",
    },
    typeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "flex-end",
    },
    typePill: {
        borderRadius: 8,
        minHeight: 28,
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    typeText: {
        color: "#FFF",
        fontFamily: "Courier New",
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    spriteStage: {
        alignItems: "center",
        aspectRatio: 1.08,
        backgroundColor: "#FFF",
        borderRadius: 8,
        justifyContent: "center",
        width: "100%",
    },
    mainSprite: {
        height: "88%",
        width: "88%",
    },
    spriteStrip: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    spriteTile: {
        flex: 1,
        gap: 6,
    },
    spriteTileImageWrap: {
        alignItems: "center",
        aspectRatio: 1,
        backgroundColor: "#FFF",
        borderRadius: 8,
        justifyContent: "center",
        width: "100%",
    },
    spriteTileImage: {
        height: "84%",
        width: "84%",
    },
    spriteTileLabel: {
        color: "#526070",
        fontFamily: "Courier New",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
    infoPanel: {
        backgroundColor: "#FFF",
        borderColor: "#D6DFEA",
        borderRadius: 8,
        borderWidth: 1,
        padding: 16,
    },
    infoPanelWide: {
        flex: 1.08,
    },
    name: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 32,
        fontWeight: "900",
        marginBottom: 10,
    },
    description: {
        color: "#526070",
        fontFamily: "Courier New",
        fontSize: 15,
        lineHeight: 22,
    },
    metricGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 18,
    },
    metric: {
        backgroundColor: "#F4F7FB",
        borderRadius: 8,
        flexGrow: 1,
        minWidth: 120,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    metricLabel: {
        color: "#687386",
        fontFamily: "Courier New",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    metricValue: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 18,
        fontWeight: "800",
    },
    sectionTitle: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 10,
        marginTop: 22,
    },
    abilityRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    abilityPill: {
        backgroundColor: "#EEF3F8",
        borderRadius: 8,
        minHeight: 32,
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    abilityText: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 13,
        fontWeight: "700",
    },
    statsList: {
        gap: 10,
    },
    statRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minHeight: 28,
    },
    statLabel: {
        color: "#526070",
        fontFamily: "Courier New",
        fontSize: 12,
        fontWeight: "800",
        width: 64,
    },
    statTrack: {
        backgroundColor: "#E8EEF5",
        borderRadius: 999,
        flex: 1,
        height: 10,
        overflow: "hidden",
    },
    statFill: {
        borderRadius: 999,
        height: "100%",
    },
    statValue: {
        color: "#1C2636",
        fontFamily: "Courier New",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "right",
        width: 34,
    },
});
