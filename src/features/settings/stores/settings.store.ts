import { create } from 'zustand';
import { AudioDevice } from '@/shared/types';
import { saveSettingToDb } from '../services/settings.service';

interface SettingsState {
  devices: AudioDevice[];
  selectedDevice: string;
  hearMyself: boolean;
  monitorVolume: number;
  autoStartEnabled: boolean;
  stopHotkey: string;
  isRecordingStopHotkey: boolean;

  setDevices: (devices: AudioDevice[]) => void;
  setSelectedDevice: (device: string) => void;
  setHearMyself: (hearMyself: boolean) => void;
  setMonitorVolume: (volume: number) => void;
  setAutoStartEnabled: (enabled: boolean) => void;
  setStopHotkey: (hotkey: string) => void;
  setIsRecordingStopHotkey: (isRecording: boolean) => void;
  
  hydrateSettings: (dbSettings: Record<string, string>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  devices: [],
  selectedDevice: "default",
  hearMyself: true,
  monitorVolume: 1.0,
  autoStartEnabled: false,
  stopHotkey: "CTRL+SHIFT+BACKSPACE",
  isRecordingStopHotkey: false,

  setDevices: (devices) => set({ devices }),
  
  setSelectedDevice: (selectedDevice) => {
    set({ selectedDevice });
    saveSettingToDb("selectedDevice", selectedDevice);
  },
  
  setHearMyself: (hearMyself) => {
    set({ hearMyself });
    saveSettingToDb("hearMyself", hearMyself ? "true" : "false");
  },
  
  setMonitorVolume: (monitorVolume) => {
    set({ monitorVolume });
    saveSettingToDb("monitorVolume", monitorVolume.toString());
  },
  
  setAutoStartEnabled: (autoStartEnabled) => {
    set({ autoStartEnabled });
    saveSettingToDb("autoStartEnabled", autoStartEnabled ? "true" : "false");
  },
  
  setStopHotkey: (stopHotkey) => {
    set({ stopHotkey });
    saveSettingToDb("stopHotkey", stopHotkey);
  },
  
  setIsRecordingStopHotkey: (isRecordingStopHotkey) => set({ isRecordingStopHotkey }),

  hydrateSettings: (dbSettings) => {
    set((state) => ({
      selectedDevice: dbSettings["selectedDevice"] || state.selectedDevice,
      hearMyself: dbSettings["hearMyself"] ? dbSettings["hearMyself"] === "true" : state.hearMyself,
      monitorVolume: dbSettings["monitorVolume"] ? Number.parseFloat(dbSettings["monitorVolume"]) : state.monitorVolume,
      autoStartEnabled: dbSettings["autoStartEnabled"] ? dbSettings["autoStartEnabled"] === "true" : state.autoStartEnabled,
      stopHotkey: dbSettings["stopHotkey"] || state.stopHotkey,
    }));
  }
}));