// pulse variants
export const pulseVariants = {
  thriving: {
    scale: [1, 1.08, 1],
    transition: { duration: 200, repeat: Infinity },
  },
  stable: {
    scale: [1, 1.04, 1],
    transition: { duration: 400, repeat: Infinity },
  },
  unstable: {
    scale: [1, 1.02, 1],
    transition: { duration: 800, repeat: Infinity },
  },
} as const;
