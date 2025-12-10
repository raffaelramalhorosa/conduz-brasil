import { useState, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface UseUserLocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
  getCurrentLocation: () => void;
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Geolocalização não é suportada pelo seu navegador");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = "Erro ao obter localização";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada. Ative nas configurações do navegador.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Localização indisponível no momento.";
            break;
          case err.TIMEOUT:
            errorMessage = "Tempo esgotado ao buscar localização.";
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  return { location, error, loading, getCurrentLocation };
};
