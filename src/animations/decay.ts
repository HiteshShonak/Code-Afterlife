// decay variants
export const decayVariants = {
  thriving: {
    opacity: 1,
    filter: 'saturate(118%) brightness(104%)',
    scale: 1,
  },
  stable: {
    opacity: 1,
    filter: 'saturate(100%)',
    scale: 1,
  },
  unstable: {
    opacity: 0.92,
    filter: 'saturate(82%) brightness(90%)',
    scale: 1,
  },
  nearDeath: {
    opacity: 0.82,
    filter: 'saturate(68%) grayscale(28%) brightness(80%)',
    scale: 1,
  },
  dead: {
    opacity: 0.74,
    filter: 'saturate(58%) grayscale(46%) brightness(70%)',
    scale: 1,
  },
} as const;
