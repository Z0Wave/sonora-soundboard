import { invoke } from "@/infrastructure/tauri/invoke";
import { Profile, SoundItem } from "@/shared/types";
import { useSoundboardStore } from "@/features/soundboard/stores/soundboard.store";

// PROFILES
export async function getProfiles(): Promise<Profile[]> {
  return invoke<Profile[]>("get_profiles");
}

export async function saveProfileToDb(id: string, name: string): Promise<void> {
  return invoke("save_profile_to_db", { id, name });
}

export async function deleteProfileFromDb(id: string): Promise<void> {
  return invoke("delete_profile_from_db", { id });
}

// SOUND LIBRARY
export async function getLibrary(): Promise<SoundItem[]> {
  return invoke<SoundItem[]>("get_library");
}

export async function saveSoundToDb(id: string, name: string, filepath: string, profileId: string): Promise<void> {
  return invoke("save_sound_to_db", { id, name, filepath, profileId });
}

export async function deleteSoundFromDb(id: string): Promise<void> {
  return invoke("delete_sound_from_db", { id });
}

export async function setSoundHotkey(id: string, hotkey: string): Promise<void> {
  return invoke("set_sound_hotkey", { id, hotkey });
}

export async function cropAudioFile(inputPath: string, startSec: number, endSec: number, volume: number): Promise<string> {
  return invoke<string>("crop_audio_file", { inputPath, startSec, endSec, volume });
}

// AUDIO PLAYBACK
export async function playSound(soundId: string): Promise<void> {
  // 🛡️ O ESCUDO: Se o usuário estiver mapeando uma tecla, bloqueia o áudio imediatamente.
  if (useSoundboardStore.getState().recordingHotkeyFor !== null) return;
  
  // Se não estiver gravando tecla nenhuma, manda o Rust tocar o som!
  return invoke("play_sound", { soundId });
}

export async function stopSound(soundId: string): Promise<void> {
  return invoke("stop_sound", { soundId });
}

export async function stopAllSounds(): Promise<void> {
  return invoke("stop_all_sounds");
}