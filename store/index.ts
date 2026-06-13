// store/index.ts
import { create } from "zustand";
import type { DiaryEntry, EntryFilters, DiaryStats } from "@/types";

interface DiaryStore {
  // Selected entry
  selectedEntry: DiaryEntry | null;
  setSelectedEntry: (entry: DiaryEntry | null) => void;

  // Filters
  filters: EntryFilters;
  setFilters: (filters: Partial<EntryFilters>) => void;
  resetFilters: () => void;

  // Stats cache
  stats: DiaryStats | null;
  setStats: (stats: DiaryStats) => void;

  // UI state
  isAddingEntry: boolean;
  setIsAddingEntry: (v: boolean) => void;
}

const defaultFilters: EntryFilters = {
  search: "",
  genre: "",
  year: "",
  sort: "newest",
};

export const useDiaryStore = create<DiaryStore>((set) => ({
  selectedEntry: null,
  setSelectedEntry: (entry) => set({ selectedEntry: entry }),

  filters: defaultFilters,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  stats: null,
  setStats: (stats) => set({ stats }),

  isAddingEntry: false,
  setIsAddingEntry: (v) => set({ isAddingEntry: v }),
}));
