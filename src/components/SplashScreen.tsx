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
          className="fixed inset-0 z-[100] grid place-items-center bg-background"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: "0 0 0 0 rgba(46,125,50,0.5)", animation: "fs-pulse 1.6s ease-out infinite" }}
              />
              <FlowSpringLogo size={96} />
            </motion.div>
            <div className="text-primary font-bold text-xl tracking-tight">FlowSpring</div>
            <div className="text-xs text-muted-foreground">Water Safety Network</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
