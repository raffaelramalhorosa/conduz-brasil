import { useState, useCallback, useRef } from 'react';
import type { GeocodingResult } from '@/types/map';

export function useNominatimGeocode() {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return [];
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    return new Promise<GeocodingResult[]>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=br&limit=5`,
            { headers: { 'User-Agent': 'ConduzBrasil/1.0' } }
          );
          const data = await res.json();
          const mapped: GeocodingResult[] = data.map((d: any) => ({
            display_name: d.display_name,
            lat: d.lat,
            lon: d.lon,
          }));
          setResults(mapped);
          resolve(mapped);
        } catch {
          setResults([]);
          resolve([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    });
  }, []);

  const clearResults = useCallback(() => setResults([]), []);

  return { search, results, isSearching, clearResults };
}
