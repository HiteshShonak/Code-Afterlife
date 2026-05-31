import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';

// Define cinematic visual configurations for each of the 5 stages
const STAGE_CONFIGS = {
  0: { // Born
    baseColor: "rgba(255, 255, 255, 1)",
    bgColor: "rgba(255, 255, 255, 0.1)",
    glowColor: "rgba(255, 255, 255, 0.4)",
    pulseDuration: 4,
    scale: [1, 1.05, 1],
    textClass: "text-foreground",
    desc: "INIT"
  },
  1: { // Active
    baseColor: "rgba(139, 92, 246, 1)", // Violet (Accent)
    bgColor: "rgba(139, 92, 246, 0.1)",
    glowColor: "rgba(139, 92, 246, 0.5)",
    pulseDuration: 2, // Fast heartbeat
    scale: [1, 1.15, 1],
    textClass: "text-accent",
    desc: "SYNC"
  },
  2: { // Stalled
    baseColor: "rgba(245, 158, 11, 1)", // Amber
    bgColor: "rgba(245, 158, 11, 0.1)",
    glowColor: "rgba(245, 158, 11, 0.2)",
    pulseDuration: 6, // Slow, struggling pulse
    scale: [1, 1.02, 1],
    textClass: "text-amber-500",
    desc: "WARN"
  },
  3: { // Dead
    baseColor: "rgba(239, 68, 68, 0.5)", // Faded Red / Decay
    bgColor: "rgba(239, 68, 68, 0.05)",
    glowColor: "rgba(0, 0, 0, 0)",
    pulseDuration: 0, // No pulse, dead
    scale: [1, 1, 1],
    textClass: "text-red-500",
    desc: "HALT"
  },
  4: { // Flatline
    baseColor: "rgba(255, 255, 255, 0.28)",
    bgColor: "rgba(255, 255, 255, 0.025)",
    glowColor: "rgba(0, 0, 0, 0)",
    pulseDuration: 0,
    scale: [1, 1, 1],
    textClass: "text-foreground/45",
    desc: "SILENT"
  }
};

type LifecycleNodeData = {
  label: string;
  isActive: boolean;
  isPast: boolean;
  stageIndex: keyof typeof STAGE_CONFIGS;
};

export function LifecycleNode({ data }: { data: LifecycleNodeData }) {
  const isActive = data.isActive;
  const isPast = data.isPast;
  const stageIndex = data.stageIndex;
  
  const config = STAGE_CONFIGS[stageIndex] || STAGE_CONFIGS[0];

  return (
    <div className="relative flex items-center justify-center">
      {/* Cinematic Aura / Pulse (Only when active and alive) */}
      {isActive && config.pulseDuration > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: config.scale }}
          transition={{ duration: config.pulseDuration, repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: config.glowColor }}
          className="absolute inset-0 -z-10 rounded-full blur-[30px]"
        />
      )}
      
      {/* Enlarged Cinematic Node Body */}
      <motion.div 
        animate={{ 
          borderColor: isActive ? config.baseColor : isPast ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
          backgroundColor: isActive ? config.bgColor : isPast ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0)",
          opacity: isActive ? 1 : isPast ? 0.6 : 0.3
        }}
        className={`flex h-24 w-64 flex-col items-center justify-center rounded-xl border bg-transparent backdrop-blur-md transition-colors duration-1000 ${isActive && config.pulseDuration === 0 ? 'contrast-75' : ''}`}
      >
        <span className={`font-mono text-sm uppercase tracking-[0.3em] transition-colors duration-1000 ${isActive ? config.textClass : 'text-foreground/50'}`}>
          {data.label}
        </span>
        
        {/* Sub-label for extra technical aesthetics */}
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isActive ? 1 : 0, height: isActive ? 'auto' : 0 }}
          className="mt-2 flex items-center gap-2 overflow-hidden"
        >
          <span className={`size-1.5 rounded-full ${isActive && config.pulseDuration > 0 ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.baseColor }} />
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">{config.desc}</span>
        </motion.div>
      </motion.div>

      <Handle type="target" position={Position.Top} className="!opacity-0 !border-none !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !border-none !bg-transparent" />
    </div>
  );
}
