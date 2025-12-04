import { Vote } from '../types';

const STORAGE_KEY = 'votodirecto_votes';
const SHEET_URL_KEY = 'votodirecto_sheet_url';

export const getSheetUrl = (): string => {
  return localStorage.getItem(SHEET_URL_KEY) || '';
};

export const setSheetUrl = (url: string): void => {
  localStorage.setItem(SHEET_URL_KEY, url);
};

export const saveVote = async (vote: Vote): Promise<void> => {
  // 1. Save Local (Optimistic update and backup)
  const currentVotes = getVotes();
  const updatedVotes = [...currentVotes, vote];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVotes));

  // 2. Save to Google Sheet (Fire and forget)
  const sheetUrl = getSheetUrl();
  if (sheetUrl) {
    try {
      // mode: 'no-cors' is required for Google Apps Script Web Apps consumed from client-side
      // We use text/plain to avoid CORS preflight checks which GAS doesn't handle
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(vote),
      });
    } catch (error) {
      console.error("Error enviando datos al Sheet:", error);
    }
  }
};

export const getVotes = (): Vote[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearVotes = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const fetchRemoteVotes = async (): Promise<Vote[] | null> => {
  const sheetUrl = getSheetUrl();
  if (!sheetUrl) return null;

  try {
    // Append timestamp to avoid caching AND use cache: 'no-store'
    const response = await fetch(`${sheetUrl}?t=${Date.now()}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // Validate that it looks like an array of votes
    if (Array.isArray(data)) {
      // Sync local storage with cloud data so we have a cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo datos remotos:", error);
    return null;
  }
};