import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { Pokemon } from "@/types/pokemon";
import { readFavorites, writeFavorites } from "@/utils/favoriteStorage";

type FavoritesContextValue = {
  favorites: Pokemon[];
  ready: boolean;
  storageError: string;
  toggleFavorite: (pokemon: Pokemon) => void;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function validFavorites(value: unknown): value is Pokemon[] {
  return Array.isArray(value) && value.every(item => item && typeof item.name === "string"
    && typeof item.url === "string" && /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/\d+\/$/.test(item.url)
    && Array.isArray(item.types) && item.types.every((type: unknown) => typeof type === "string")
    && (item.front == null || typeof item.front === "string"));
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<Pokemon[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const lastSaved = useRef("[]");
  const pendingWrite = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const raw = await readFavorites();
        const saved: unknown = raw ? JSON.parse(raw) : [];
        if (!validFavorites(saved)) throw new Error("Invalid saved favorites");
        if (!cancelled) {
          lastSaved.current = JSON.stringify(saved);
          setFavorites(saved);
        }
      } catch {
        if (!cancelled) setStorageError("Saved favorites could not be loaded. You can still use favorites this session.");
      } finally { if (!cancelled) setReady(true); }
    }
    void restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(favorites);
    if (!ready || serialized === lastSaved.current) return;
    lastSaved.current = serialized;
    pendingWrite.current = pendingWrite.current.then(() => writeFavorites(serialized))
      .then(() => setStorageError(""))
      .catch(() => setStorageError("Favorites could not be saved to this device. Changes are available this session."));
  }, [favorites, ready]);

  function toggleFavorite(pokemon: Pokemon) {
    if (!ready) return;
    setFavorites(current => current.some(item => item.name === pokemon.name)
      ? current.filter(item => item.name !== pokemon.name)
      : [...current, { name: pokemon.name, url: pokemon.url, front: pokemon.front, types: pokemon.types }]);
  }

  return <FavoritesContext.Provider value={{ favorites, ready, storageError, toggleFavorite }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites requires FavoritesProvider");
  return value;
}
