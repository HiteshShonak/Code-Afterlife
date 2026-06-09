export interface Project {
  id: string;
  name: string;
  born: string;
  died: string;
  quote: string;
  status: "DECEASED" | "RESURRECTED";
  timeCapsules: number;
  soulConnections: number;
  /** Optional slug — only present for real DB projects, not mock data */
  slug?: string;
  resurrectedBy?: {
    name: string;
    handle: string;
    date: string;
    avatarUrl: string;
  };
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "StudyFlow",
    born: "Nov 2023",
    died: "Aug 2024",
    quote: '"Paused during placements."',
    status: "RESURRECTED",
    timeCapsules: 3,
    soulConnections: 56,
    resurrectedBy: {
      name: "Mira",
      handle: "@mira-ng",
      date: "12 Oct 2024 • 10:42 PM",
      avatarUrl: "https://i.pravatar.cc/150?u=mira",
    }
  },
  {
    id: "2",
    name: "AuraUI",
    born: "Mar 2024",
    died: "Jun 2024",
    quote: '"Rewrite never finished."',
    status: "DECEASED",
    timeCapsules: 1,
    soulConnections: 12,
  },
  {
    id: "3",
    name: "QuickNote API",
    born: "Oct 2023",
    died: "Feb 2024",
    quote: '"Burned out during finals."',
    status: "DECEASED",
    timeCapsules: 0,
    soulConnections: 4,
  },
  {
    id: "4",
    name: "TaskBridge",
    born: "Jan 2023",
    died: "May 2024",
    quote: '"Lost momentum after internship."',
    status: "DECEASED",
    timeCapsules: 5,
    soulConnections: 89,
  },
  {
    id: "5",
    name: "DevConnect",
    born: "Dec 2022",
    died: "Jul 2024",
    quote: '"Maintainer left for good."',
    status: "DECEASED",
    timeCapsules: 2,
    soulConnections: 18,
  }
];

const GEN_NAMES = [
  "NightOwl", "Pixelsmith", "Codex", "DawnTracker", "ByteForge",
  "Mosaic", "Luminary", "Clearpath", "Nebula", "Prismify",
  "EchoSync", "Solstice", "Driftwood", "IronCore", "Harmonia",
  "Cascade", "Zenith", "Parallax", "Starfield", "Kindling",
  "Verdant", "Frostbite", "Lantern", "Cortex", "ShadowMesh",
  "Ripple", "Bastion", "Crescent", "Helix", "Overture",
  "Sable", "Gossamer", "Quartz", "Ember", "Lodestar",
  "Vesper", "Arcline", "Fluxion", "TidalDB", "Mirage",
  "Windmill", "Presto", "Cairn", "Velvet", "Beacon",
  "Cobalt", "NovaCLI", "Anchor", "Eventide", "Meridian",
  "Forge", "Opal", "Chronicle", "Drift", "Sentinel",
  "Wisp", "Fable", "Tempest", "Vault", "Candela",
  "Orbit", "Bloom", "Haven", "Stratos", "Trellis",
  "Kindle", "Aegis", "Grain", "Waypoint", "Nimbus",
  "Quill", "Frost", "Spark", "Terrain", "Loom",
  "Atlas", "Clarity", "Pebble", "Zephyr", "Ember",
  "Foundry", "Cedar", "Pulse", "Pinnacle", "Crest",
  "Tide", "Lucent", "Shard", "Canopy", "Arbor",
  "Slate", "Radix", "Monsoon", "Silica", "Grasp",
];
const GEN_QUOTES = [
  '"Lost to time and scope creep."',
  '"Never survived the rewrite."',
  '"The tests passed. The market didn\'t."',
  '"Built with love. Abandoned with guilt."',
  '"One commit away from greatness."',
  '"Killed by a better idea."',
  '"The demo worked perfectly."',
  '"Dependencies rotted before launch."',
  '"Could not find product-market fit."',
  '"Shelved during exam season."',
  '"The team moved on."',
  '"Funding ran out at v0.3."',
  '"Too ambitious for one developer."',
  '"Replaced by an open-source alternative."',
  '"Died in a merge conflict."',
  '"The hackathon ended."',
  '"Pivoted into oblivion."',
  '"Burned out before beta."',
  '"The API it depended on was deprecated."',
  '"Nobody read the documentation."',
];
const GEN_BORN = ["Jan 2022","Mar 2022","Jun 2022","Sep 2022","Nov 2022","Jan 2023","Apr 2023","Jul 2023","Oct 2023","Feb 2024"];
const GEN_DIED = ["May 2023","Aug 2023","Nov 2023","Feb 2024","May 2024","Jul 2024","Sep 2024","Dec 2024","Mar 2025","Jun 2025"];

// Dynamically generate the remaining 95 items for a total of 100 projects
export const extendedMockProjects: Project[] = [
  ...mockProjects,
  ...Array.from({ length: 95 }).map((_, i) => ({
    id: `generated-${i + 6}`,
    name: GEN_NAMES[i % GEN_NAMES.length],
    born: GEN_BORN[i % GEN_BORN.length],
    died: GEN_DIED[i % GEN_DIED.length],
    quote: GEN_QUOTES[i % GEN_QUOTES.length],
    status: (i % 8 === 0 ? "RESURRECTED" : "DECEASED") as "DECEASED" | "RESURRECTED",
    timeCapsules: Math.floor(Math.random() * 5),
    soulConnections: Math.floor(Math.random() * 100),
    ...(i % 8 === 0 ? {
      resurrectedBy: {
        name: "Dev" + i,
        handle: "@dev" + i,
        date: "14 Oct 2024 • 08:00 AM",
        avatarUrl: `https://i.pravatar.cc/150?u=${i}`
      }
    } : {})
  }))
];
