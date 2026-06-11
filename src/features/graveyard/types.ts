export interface Project {
  id: string;
  name: string;
  born: string;
  died: string;
  diedAt: number; // For accurate sorting
  quote: string;
  status: 'DECEASED' | 'RESURRECTED';
  timeCapsules: number;
  soulConnections: number;
  viewCount: number;
  voteCount: number;
  slug?: string;
  resurrectedBy?: {
    name: string;
    handle: string;
    date: string;
    avatarUrl: string;
  };
}
