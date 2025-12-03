import { Candidate, Region } from './types';

export const CANDIDATES: Candidate[] = [
  {
    id: 'cand_1',
    name: 'Elena Torres',
    party: 'Futuro Progresista',
    color: '#3b82f6', // blue-500
    avatarUrl: 'https://picsum.photos/id/64/200/200',
  },
  {
    id: 'cand_2',
    name: 'Carlos Mendez',
    party: 'Alianza Nacional',
    color: '#ef4444', // red-500
    avatarUrl: 'https://picsum.photos/id/91/200/200',
  },
  {
    id: 'cand_3',
    name: 'Sofia Ramirez',
    party: 'Movimiento Verde',
    color: '#22c55e', // green-500
    avatarUrl: 'https://picsum.photos/id/65/200/200',
  },
];

export const REGIONS: Region[] = [
  { id: 'norte', name: 'Zona Norte' },
  { id: 'centro', name: 'Zona Centro' },
  { id: 'sur', name: 'Zona Sur' },
  { id: 'este', name: 'Zona Este' },
  { id: 'oeste', name: 'Zona Oeste' },
  { id: 'capital', name: 'Distrito Capital' },
];
