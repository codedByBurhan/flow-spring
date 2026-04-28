import { useEffect, useState } from "react";

export interface GeoState {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    loading: true,
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ loading: false, latitude: null, longitude: null, error: "Geolocation not supported" });
      return;
    }
    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          loading: false,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
        });
      },
      (err) => {
        setState({ loading: false, latitude: null, longitude: null, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    return () => {
      // getCurrentPosition has no cancel; id is undefined here
      void id;
    };
  }, []);

  return state;
}