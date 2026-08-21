
import { useEffect, useRef } from "react";
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { Outlet } from "react-router-dom";



import { Sidebar } from "@/components/Sidebar"; 
import { getProfiles, getLibrary, setSoundHotkey, playSound, stopAllSounds } from "@/features/soundboard/services/soundboard.service";
import { listAudioDevices, setAudioRoute, setMasterVolume, checkAutostartStatus, loadSettingsFromDb } from "@/features/settings/services/settings.service";

// CAIXAS FORTES (ZUSTAND)
import { useSoundboardStore } from "@/features/soundboard/stores/soundboard.store";
import { useSettingsStore } from "@/features/settings/stores/settings.store";

export default function MainLayout() {
  const { library, setLibrary, activeProfile, setProfiles, setActiveProfile, recordingHotkeyFor, setRecordingHotkeyFor } = useSoundboardStore();
  const { selectedDevice, hearMyself, monitorVolume, setAutoStartEnabled, setDevices, stopHotkey, isRecordingStopHotkey, setStopHotkey, setIsRecordingStopHotkey, hydrateSettings } = useSettingsStore();

  const cooldownsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const dbProfiles = await getProfiles();
        if (dbProfiles && dbProfiles.length > 0) {
          setProfiles(dbProfiles);
          setActiveProfile(dbProfiles[0]);
        }
        const dbSounds = await getLibrary();
        setLibrary(dbSounds);
      } catch (err) {
        console.error("Erro ao carregar banco de dados:", err);
      }
    };
    loadDatabase();
    
    loadSettingsFromDb().then((dbSettings) => {
      hydrateSettings(dbSettings);
    }).catch(console.error);

    checkAutostartStatus().then(setAutoStartEnabled).catch(console.error);
    listAudioDevices().then(setDevices).catch(console.error);
  }, []);

  useEffect(() => { setAudioRoute(selectedDevice).catch(console.error); }, [selectedDevice]);
  useEffect(() => { setMasterVolume(hearMyself ? monitorVolume : 0.0).catch(console.error); }, [hearMyself, monitorVolume]);

  useEffect(() => {
    if (!recordingHotkeyFor && !isRecordingStopHotkey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
      
      let keys = [];
      if (e.ctrlKey) keys.push("CommandOrControl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      let key = e.key.toUpperCase();
      if (key === " ") key = "Space";
      keys.push(key);
      const finalHotkey = keys.join("+");
      
      if (isRecordingStopHotkey) {
        setStopHotkey(finalHotkey);
        setIsRecordingStopHotkey(false);
      } else if (recordingHotkeyFor) { 
        setLibrary(prev => prev.map(s => s.id === recordingHotkeyFor ? { ...s, hotkey: finalHotkey } : s));
        setSoundHotkey(recordingHotkeyFor, finalHotkey).catch(console.error);
        setRecordingHotkeyFor(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordingHotkeyFor, isRecordingStopHotkey]);

  useEffect(() => {
    // Array para guardar tudo que registramos nesta montagem, para limparmos na saída
    const registeredShortcuts: string[] = [];

    const setupShortcuts = async () => {
      try {
        const activeLibrary = library.filter(s => s.profileId === activeProfile?.id);
        
        // Função auxiliar robusta para registrar com segurança
        const safeRegister = async (hotkey: string, callback: (event: any) => void) => {
          if (!hotkey) return;
          const isReg = await isRegistered(hotkey);
          if (isReg) {
            await unregister(hotkey); // Força a liberação antes de pegar
          }
          await register(hotkey, callback);
          registeredShortcuts.push(hotkey);
        };

        // 1. Registra os atalhos dos sons
        for (const sound of activeLibrary) {
          const currentHotkey = sound.hotkey_code || sound.hotkey;
          if (currentHotkey) {
            await safeRegister(currentHotkey, (event) => {
              if (event && (event as any).state === "Released") return;
              const now = Date.now();
              if (now - (cooldownsRef.current[sound.id] || 0) >= 2000) {
                cooldownsRef.current[sound.id] = now;
                playSound(sound.id).catch(console.error);
              }
            });
          }
        }

        // 2. Registra o botão de pânico
        if (stopHotkey) {
          await safeRegister(stopHotkey, (event) => {
            if (event && (event as any).state === "Released") return;
            stopAllSounds().catch(console.error);
          });
        }
      } catch (error) {
        console.error("Falha ao configurar atalhos globais:", error);
      }
    };

    setupShortcuts();

    // CLEANUP: Quando o useEffect rodar novamente ou a tela morrer, devolva as teclas ao Windows
    return () => {
      registeredShortcuts.forEach(async (hotkey) => {
        try {
          if (await isRegistered(hotkey)) {
            await unregister(hotkey);
          }
        } catch (e) {
          console.error(`Falha ao desregistrar ${hotkey}:`, e);
        }
      });
    };
  }, [library, activeProfile, stopHotkey]);

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden border border-[#1a1a1a] rounded-lg shadow-2xl">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#000000]">
        <div className="flex-1 h-full w-full overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}