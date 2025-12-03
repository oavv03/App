export interface Candidate {
  id: string;
  name: string;
  party: string;
  color: string;
  avatarUrl: string;
}

export interface Vote {
  id: string;
  candidateId: string;
  region: string; // Provincia o Estado
  timestamp: number;
}

export interface VoteSummary {
  candidateId: string;
  count: number;
}

export interface Region {
  id: string;
  name: string;
}

export type TabView = 'vote' | 'results' | 'analysis';
