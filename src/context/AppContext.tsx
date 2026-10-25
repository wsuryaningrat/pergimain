import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { places, type Place } from "../data/places";

interface ItineraryItem {
  place: Place;
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

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
    }),
    [savedIds, itinerary]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function getPlaceById(id: string): Place | undefined {
  return places.find((p) => p.id === id);
}
