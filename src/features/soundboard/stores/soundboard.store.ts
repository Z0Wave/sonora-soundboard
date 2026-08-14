
import { create } from 'zustand';
import { SoundItem, Profile } from '@/shared/types';

interface SoundboardState {
  library: SoundItem[];
  profiles: Profile[];
  activeProfile: Profile;
  recordingHotkeyFor: string | null;

  // Suporta tanto enviar a array nova, quanto uma função (prev => ...)
  setLibrary: (updater: SoundItem[] | ((prev: SoundItem[]) => SoundItem[])) => void;
  setProfiles: (updater: Profile[] | ((prev: Profile[]) => Profile[])) => void;
  
  setActiveProfile: (profile: Profile) => void;
  setRecordingHotkeyFor: (id: string | null) => void;
}

export const useSoundboardStore = create<SoundboardState>((set) => ({
  // Valores Iniciais
  library: [],
  profiles: [{ id: "1", name: "DEFAULT" }],
  activeProfile: { id: "1", name: "DEFAULT" },
  recordingHotkeyFor: null,

  // Ações com suporte a "prev state"
  setLibrary: (updater) => set((state) => ({
    library: typeof updater === 'function' ? updater(state.library) : updater
  })),
  setProfiles: (updater) => set((state) => ({
    profiles: typeof updater === 'function' ? updater(state.profiles) : updater
  })),
  setActiveProfile: (activeProfile) => set({ activeProfile }),
  setRecordingHotkeyFor: (recordingHotkeyFor) => set({ recordingHotkeyFor }),
}));