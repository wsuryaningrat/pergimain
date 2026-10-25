import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { places, type Place } from "../data/places";

interface ItineraryItem {
  place: Place;
}

const USER_PLACES_KEY = "pergimain_user_places";

function loadUserPlaces(): Place[] {
  try {
    const raw = localStorage.getItem(USER_PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface AppContextValue {
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  itinerary: ItineraryItem[];
  addToItinerary: (place: Place) => void;
  removeFromItinerary: (id: string) => void;
  moveItinerary: (index: number, direction: -1 | 1) => void;
  clearItinerary: () => void;
  allPlaces: Place[];
  userPlaces: Place[];
  addUserPlace: (place: Place) => void;
  getPlace: (id: string) => Place | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [userPlaces, setUserPlaces] = useState<Place[]>(() => loadUserPlaces());

  useEffect(() => {
    try {
      localStorage.setItem(USER_PLACES_KEY, JSON.stringify(userPlaces));
    } catch {
      // ignore storage failures (e.g. private browsing quota)
    }
  }, [userPlaces]);

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSaved = (id: string) => savedIds.has(id);

  const addToItinerary = (place: Place) => {
    setItinerary((prev) => {
      if (prev.some((item) => item.place.id === place.id)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, { place }];
    });
  };

  const removeFromItinerary = (id: string) => {
    setItinerary((prev) => prev.filter((item) => item.place.id !== id));
  };

  const moveItinerary = (index: number, direction: -1 | 1) => {
    setItinerary((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const clearItinerary = () => setItinerary([]);

  const addUserPlace = (place: Place) => {
    setUserPlaces((prev) => [place, ...prev]);
  };

  const allPlaces = useMemo(() => [...places, ...userPlaces], [userPlaces]);

  const getPlace = (id: string) => allPlaces.find((p) => p.id === id);

  const value = useMemo(
    () => ({
      savedIds,
      toggleSaved,
      isSaved,
      itinerary,
      addToItinerary,
      removeFromItinerary,
      moveItinerary,
      clearItinerary,
      allPlaces,
      userPlaces,
      addUserPlace,
      getPlace,
    }),
    [savedIds, itinerary, allPlaces, userPlaces]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
