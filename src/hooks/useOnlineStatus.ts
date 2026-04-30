import { useEffect, useState } from "react";

export function useOnlineStatus() {
  // Always start as `true` to keep SSR and first client render consistent.
  // Real status is read after mount to avoid hydration mismatches.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setOnline(navigator.onLine);
    }
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  return online;
}