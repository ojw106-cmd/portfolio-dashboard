import { create } from 'zustand';

export interface Sector {
  id: string;
  code: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface SectorStore {
  sectors: Sector[];
  isLoading: boolean;
  fetchSectors: () => Promise<void>;
  addSector: (code: string, name: string, color: string) => Promise<Sector | null>;
  updateSector: (id: string, data: Partial<Sector>) => Promise<void>;
  deleteSector: (id: string) => Promise<void>;
  getSectorName: (code: string) => string;
  getSectorColor: (code: string) => string;
  getSectorMap: () => Record<string, string>;
  getSectorColorMap: () => Record<string, string>;
}

export const useSectorStore = create<SectorStore>((set, get) => ({
  sectors: [],
  isLoading: false,

  fetchSectors: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/sectors');
      const data = await res.json();
      set({ sectors: data });
    } catch (error) {
      console.error('Failed to fetch sectors:', error);
    }
    set({ isLoading: false });
  },

  addSector: async (code: string, name: string, color: string) => {
    try {
      const res = await fetch('/api/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, color }),
      });
      if (res.ok) {
        const newSector = await res.json();
        set((state) => ({
          sectors: [...state.sectors, newSector],
        }));
        return newSector;
      }
    } catch (error) {
      console.error('Failed to add sector:', error);
    }
    return null;
  },

  updateSector: async (id: string, data: Partial<Sector>) => {
    try {
      const res = await fetch('/api/sectors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          sectors: state.sectors.map((s) => (s.id === id ? updated : s)),
        }));
      }
    } catch (error) {
      console.error('Failed to update sector:', error);
    }
  },

  deleteSector: async (id: string) => {
    try {
      const res = await fetch(`/api/sectors?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          sectors: state.sectors.filter((s) => s.id !== id),
        }));
      }
    } catch (error) {
      console.error('Failed to delete sector:', error);
    }
  },

  getSectorName: (code: string) => {
    const sector = get().sectors.find((s) => s.code === code);
    return sector?.name || code;
  },

  getSectorColor: (code: string) => {
    const sector = get().sectors.find((s) => s.code === code);
    return sector?.color || '#9e9e9e';
  },

  getSectorMap: () => {
    const map: Record<string, string> = {};
    get().sectors.forEach((s) => {
      map[s.code] = s.name;
    });
    return map;
  },

  getSectorColorMap: () => {
    const map: Record<string, string> = {};
    get().sectors.forEach((s) => {
      map[s.code] = s.color;
    });
    return map;
  },
}));
