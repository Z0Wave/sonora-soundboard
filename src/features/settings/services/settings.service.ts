
import { invoke } from "@/infrastructure/tauri/invoke";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { AudioDevice } from "@/shared/types";

export async function listAudioDevices(): Promise<AudioDevice[]> {
  return invoke<AudioDevice[]>("list_audio_devices");
}

export async function setAudioRoute(deviceName: string): Promise<void> {
  return invoke("set_audio_route", { deviceName });
}

export async function setMasterVolume(volume: number): Promise<void> {
  return invoke("set_master_volume", { volume });
}

export async function checkAutostartStatus(): Promise<boolean> {
  return isEnabled();
}

export async function enableAppAutostart(): Promise<boolean> {
  await enable();
  return true;
}

export async function disableAppAutostart(): Promise<boolean> {
  await disable();
  return false;
}

export const loadSettingsFromDb = async (): Promise<Record<string, string>> => {
  try {
    return await invoke("get_settings_db");
  } catch (error) {
    console.error("Erro ao carregar configurações do banco:", error);
    return {};
  }
};

export const saveSettingToDb = async (key: string, value: string): Promise<void> => {
  try {
    await invoke("save_setting_db", { key, value });
  } catch (error) {
    console.error(`Erro ao salvar configuração [${key}]:`, error);
  }
};