import { Variants } from "framer-motion";

// cinematic easing curve
export const CINEMATIC_EASE = [0.16, 1, 0.3, 1];

export const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 1.2, ease: CINEMATIC_EASE } 
  },
};

export const SLOW_REVEAL: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 1.8, ease: CINEMATIC_EASE } 
  },
};

export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const FADE_IN_SUBTLE: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 2.5, ease: CINEMATIC_EASE } 
  },
};
