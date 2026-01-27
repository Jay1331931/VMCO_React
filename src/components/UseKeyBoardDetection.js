import { useEffect, useState } from "react";

export function useKeyboardDetection() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const diff = lastHeight - currentHeight;

      // threshold avoids false positives
      if (diff > 150) {
        setKeyboardOpen(true);   // keyboard opened
      } else if (diff < -150) {
        setKeyboardOpen(false);  // keyboard closed
      }

      lastHeight = currentHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return keyboardOpen;
}
