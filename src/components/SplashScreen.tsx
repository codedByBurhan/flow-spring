import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlowSpringLogo } from "./FlowSpringLogo";

const SPLASH_KEY = "flowspring_splash_shown";

export function SplashScreen() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setShow(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[300] grid place-items-center bg-white"
          aria-label="Loading FlowSpring"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative fs-spring-in">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(46,125,50,0.5)",
                  animation: "fs-pulse 1.6s ease-out infinite",
                }}
              />
              <FlowSpringLogo size={88} />
            </div>
            <div
              className="fs-fade-up font-extrabold text-2xl tracking-tight"
              style={{ color: "#2E7D32", animationDelay: "300ms" }}
            >
              FlowSpring
            </div>
            <div
              className="fs-fade-up text-xs"
              style={{ color: "#6B7280", animationDelay: "400ms" }}
            >
              Water Safety Network · SDG 6
            </div>
            <span className="fs-sdg-pill fs-fade-up" style={{ animationDelay: "550ms" }}>
              💧 SDG 6
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
