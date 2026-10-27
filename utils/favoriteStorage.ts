import { Platform } from "react-native";

const KEY = "minidex-favorites-v1";

export async function readFavorites(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(KEY);
  const fs = await import("expo-file-system/legacy");
  if (!fs.documentDirectory) throw new Error("Device storage unavailable");
  const path = `${fs.documentDirectory}${KEY}.json`;
  return (await fs.getInfoAsync(path)).exists ? fs.readAsStringAsync(path) : null;
}

export async function writeFavorites(value: string): Promise<void> {
  if (Platform.OS === "web") { localStorage.setItem(KEY, value); return; }
  const fs = await import("expo-file-system/legacy");
  if (!fs.documentDirectory) throw new Error("Device storage unavailable");
  await fs.writeAsStringAsync(`${fs.documentDirectory}${KEY}.json`, value);
}
