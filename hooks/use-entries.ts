"use client";
import { useState, useEffect, useCallback } from "react";
import type { DiaryEntry, EntryFilters } from "@/types";

interface PaginatedResult {
  items: DiaryEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function useEntries(filters: EntryFilters, page = 1) {
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.genre)  params.set("genre",  filters.genre);
      if (filters.year)   params.set("year",   filters.year);
      params.set("sort",  filters.sort);
      params.set("page",  page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/entries?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as PaginatedResult;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.genre, filters.year, filters.sort, page]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return { data, loading, error, refetch: fetchEntries };
}

export function useEntry(id: number | null) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/entries/${id}`)
      .then(r => r.json() as Promise<{ data: DiaryEntry }>)
      .then(j => setEntry(j.data))
      .finally(() => setLoading(false));
  }, [id]);

  return { entry, loading };
}
