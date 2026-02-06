import { useEffect, useRef, useState } from "react";

// Custom hook for keyboard handling
const useKeyboardHandler = () => {

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialHeight = useRef(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) return; // Desktop - ignore
      
      const currentHeight = window.innerHeight;
      const isOpen = currentHeight < initialHeight.current - 100; // Keyboard reduces height
      
      if (isOpen !== isKeyboardOpen) {
        setIsKeyboardOpen(isOpen);
        
        if (isOpen) {
          document.body.classList.add("keyboard-open");
        } else {
          document.body.classList.remove("keyboard-open");
          // Update initial height when keyboard closes
          initialHeight.current = currentHeight;
        }
      }
    };

    // Also handle visual viewport for mobile browsers
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const isOpen = window.visualViewport.height < window.outerHeight * 0.8;
        
        if (isOpen !== isKeyboardOpen) {
          setIsKeyboardOpen(isOpen);
          
          if (isOpen) {
            document.body.classList.add("keyboard-open");
          } else {
            document.body.classList.remove("keyboard-open");
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportChange);
      window.visualViewport.addEventListener("scroll", handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
        window.visualViewport.removeEventListener("scroll", handleVisualViewportChange);
      }
    };
  }, [isKeyboardOpen]);

  const handleKeyDown = (e) => {
    if (window.innerWidth <= 768) {
      const closeKeys = ["Enter", "Go", "Search", "Done", "Return"];
      if (closeKeys.includes(e.key)) {
        e.target.blur();
        document.body.classList.remove("keyboard-open");
      }
    }
  };

  const handleFocus = () => {
    if (window.innerWidth <= 768) {
      document.body.classList.add("keyboard-open");
    }
  };

  const handleBlur = () => {
    if (window.innerWidth <= 768) {
      // Small delay to ensure keyboard is fully closed
      setTimeout(() => {
        document.body.classList.remove("keyboard-open");
      }, 100);
    }
  };

  return { handleKeyDown, handleFocus, handleBlur };
};
export default useKeyboardHandler;
