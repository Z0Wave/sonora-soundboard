
export interface SoundItem {
  id: string;
  name: string;
  filepath: string;
  hotkey?: string;
  hotkey_code?: string; 
  profileId: string;
}

export interface Profile {
  id: string;
  name: string;
}

export interface AudioDevice {
  name: string;
}

// NOVA INTERFACE PARA O CONTEXTO GLOBAL
export interface AppContextType {
  formatHotkeyDisplay: (hotkey?: string) => string;
  recordingHotkeyFor: string | null;
  setRecordingHotkeyFor: (val: string | null) => void;
  library: SoundItem[];
  setLibrary: React.Dispatch<React.SetStateAction<SoundItem[]>>;
  activeProfile: Profile;
  setActiveProfile: (val: Profile) => void;
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  devices: AudioDevice[];
  selectedDevice: string;
  setSelectedDevice: (val: string) => void;
  hearMyself: boolean;
  setHearMyself: (val: boolean) => void;
  monitorVolume: number;
  setMonitorVolume: (val: number) => void;
  stopHotkey: string;
  isRecordingStopHotkey: boolean;
  setIsRecordingStopHotkey: (val: boolean) => void;
  autoStartEnabled: boolean;
  toggleAutoStart: () => void;
}