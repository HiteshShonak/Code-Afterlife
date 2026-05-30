/**
 * Framer Motion variants representing the visual decay states of projects.
 * Maps project decay stages directly to CSS filter, opacity, and transform animations.
 */
export const decayVariants = {
  thriving: {
    opacity: 1,
    filter: 'saturate(150%) brightness(110%)',
    scale: 1,
  },
  stable: {
    opacity: 1,
    filter: 'saturate(100%)',
    scale: 1,
  },
  unstable: {
    opacity: 0.7,
    filter: 'saturate(50%)',
    scale: 1,
  },
  nearDeath: {
    opacity: 0.5,
    filter: 'saturate(0%) grayscale(100%)',
  },
  dead: {
    opacity: 0.3,
    filter: 'grayscale(100%)',
    scale: 0.95,
  },
} as const;
