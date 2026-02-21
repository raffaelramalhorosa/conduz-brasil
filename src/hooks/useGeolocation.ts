import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

export function useGeolocation(autoRequest = false) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });
  const watchIdRef = useRef<number | null>(null);

  const requestLocation = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização não é suportada neste navegador.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
          isSupported: true,
        });

        // Start watchPosition to refine accuracy
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            if (accuracy < 100) {
              setState((prev) => ({
                ...prev,
                latitude,
                longitude,
              }));
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
              }
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      },
      (error) => {
        let errorMessage = 'Erro ao obter localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo esgotado ao obter localização.';
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [state.isSupported]);

  useEffect(() => {
    if (autoRequest && state.isSupported && !state.latitude && !state.longitude) {
      requestLocation();
    }
  }, [autoRequest, state.isSupported, state.latitude, state.longitude, requestLocation]);

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const clearLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState({
      latitude: null,
      longitude: null,
      error: null,
      isLoading: false,
      isSupported: state.isSupported,
    });
  }, [state.isSupported]);

  return {
    ...state,
    requestLocation,
    clearLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
}
