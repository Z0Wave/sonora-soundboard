
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSettingsStore } from "@/features/settings/stores/settings.store";
import { formatHotkeyDisplay } from "@/shared/utils/hotkeys";
import { enableAppAutostart, disableAppAutostart, setAudioRoute, setMasterVolume } from "@/features/settings/services/settings.service";
import { getVersion } from "@tauri-apps/api/app";

export function SettingsScreen() {

  const [appVersion, setAppVersion] = useState("");

useEffect(() => {
  getVersion().then((ver) => setAppVersion(ver));
}, []);

  const {
    devices, selectedDevice, setSelectedDevice,
    hearMyself, setHearMyself,
    monitorVolume, setMonitorVolume,
    autoStartEnabled, setAutoStartEnabled,
    stopHotkey, isRecordingStopHotkey, setIsRecordingStopHotkey
  } = useSettingsStore();

  // Estado local apenas para animação fluida da barra de volume
  const [tempVolume, setTempVolume] = useState(monitorVolume);

  // Garante que o estado visual inicie com o valor real salvo
  useEffect(() => {
    setTempVolume(monitorVolume);
  }, [monitorVolume]);

  const handleToggleAutoStart = async () => {
    try {
      if (autoStartEnabled) {
        await disableAppAutostart();
        setAutoStartEnabled(false);
      } else {
        await enableAppAutostart();
        setAutoStartEnabled(true);
      }
    } catch (error) {
      console.error("Erro ao alterar o autostart:", error);
    }
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value;
    setSelectedDevice(device);
    setAudioRoute(device).catch(console.error);
  };

  // Função que roda a 60 FPS ao arrastar (Apenas visual, não salva)
  const handleVolumeDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempVolume(Number.parseFloat(e.target.value));
  };

  // Função que roda UMA VEZ ao soltar o mouse (Salva no DB e no Rust)
  const handleVolumeCommit = () => {
    setMonitorVolume(tempVolume);
    setMasterVolume(tempVolume).catch(console.error);
  };

  // Captura da Tecla de Pânico
  useEffect(() => {
    if (!isRecordingStopHotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys = [];
      if (e.ctrlKey) keys.push("CTRL");
      if (e.shiftKey) keys.push("SHIFT");
      if (e.altKey) keys.push("ALT");

      const keyName = e.key.toUpperCase();
      if (!["CONTROL", "SHIFT", "ALT"].includes(keyName)) {
        keys.push(keyName === " " ? "SPACE" : keyName);
      }

      if (keys.length > 0) {
        useSettingsStore.getState().setStopHotkey(keys.join("+"));
        setIsRecordingStopHotkey(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecordingStopHotkey, setIsRecordingStopHotkey]);

  return (
    <div className="h-full w-full flex flex-col font-sans select-none text-white overflow-hidden">

      <PageHeader titlePrefix="GLOBAL /" titleHighlight="SETTINGS" hasUpdate={false} />

      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col justify-center px-8 pb-4">
        <div className="grid grid-cols-2 gap-6 w-full">
          
          {/* TECLA DE PÂNICO */}
          <div className="col-span-2 bg-[#121212] border border-[#222] rounded-3xl p-8 flex flex-col justify-center transition-all hover:border-[#333]">
            <div className="flex flex-col mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Tecla de Pânico</label>
              <span className="text-xs text-white/30 mt-1">Para todos os sons imediatamente ao ser pressionada.</span>
            </div>
            <button 
              type="button" 
              onClick={() => setIsRecordingStopHotkey(true)}
              className={`w-full py-4 rounded-xl border text-sm font-mono tracking-widest transition-all focus:outline-none ${isRecordingStopHotkey ? "border-[#cda434] text-[#cda434] bg-[#cda434]/5 animate-pulse" : "border-[#333] bg-[#1a1a1a] text-white/80 hover:border-[#cda434]/50"}`}
            >
              {isRecordingStopHotkey ? "PRESSIONE O COMBO..." : formatHotkeyDisplay(stopHotkey)}
            </button>
          </div>

          {/* CABO VIRTUAL (OUTPUT) */}
          <div className="col-span-2 bg-[#121212] border border-[#222] rounded-3xl p-8 flex flex-col justify-center transition-all hover:border-[#333]">
            <div className="flex flex-col mb-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Cabo Virtual (Output)</label>
              <span className="text-xs text-white/30 mt-1">Para onde o áudio principal será enviado (Discord, Jogos).</span>
            </div>
            <select
              value={selectedDevice}
              onChange={handleDeviceChange}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-5 py-4 text-sm text-white font-medium outline-none focus:border-[#cda434] transition-colors cursor-pointer appearance-none"
            >
              <option value="default">Desativado (Apenas Fones Padrão)</option>
              {devices.map((dev) => (
                <option key={dev.name} value={dev.name}>{dev.name}</option>
              ))}
            </select>
          </div>

          {/* SISTEMA (AUTOSTART) */}
          <div className="col-span-1 bg-[#121212] border border-[#222] rounded-3xl p-8 flex items-center justify-between transition-all hover:border-[#333]">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Sistema</label>
              <span className="text-xs text-white/30 mt-1">Iniciar com o Windows</span>
            </div>
            <button type="button" onClick={handleToggleAutoStart} className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors focus:outline-none shrink-0 ${autoStartEnabled ? "bg-[#cda434]" : "bg-[#333]"}`}>
              <div className={`w-5 h-5 bg-black rounded-full transition-transform ${autoStartEnabled ? "translate-x-7" : "translate-x-0"}`}></div>
            </button>
          </div>

          {/* RETORNO DE ÁUDIO */}
          <div className="col-span-1 bg-[#121212] border border-[#222] rounded-3xl p-8 flex flex-col justify-center transition-all hover:border-[#333]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Retorno Local</label>
                <span className="text-xs text-white/30 mt-1">Ouvir o áudio no seu fone</span>
              </div>
              <button type="button" onClick={() => setHearMyself(!hearMyself)} className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors focus:outline-none shrink-0 ${hearMyself ? "bg-[#cda434]" : "bg-[#333]"}`}>
                <div className={`w-5 h-5 bg-black rounded-full transition-transform ${hearMyself ? "translate-x-7" : "translate-x-0"}`}></div>
              </button>
            </div>
            
            <div className={`flex flex-col gap-3 transition-opacity duration-300 ${hearMyself ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Volume Local</span>
                <span className="text-xs font-mono text-[#cda434]">{Math.round(tempVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={tempVolume}
                onChange={handleVolumeDrag}
                onMouseUp={handleVolumeCommit}
                onTouchEnd={handleVolumeCommit}
                onKeyUp={handleVolumeCommit}
                className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#cda434]"
              />
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER DA VERSÃO */}
      <footer className="w-full py-6 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-mono font-medium text-white/20 uppercase tracking-[0.2em] hover:text-[#cda434]/60 transition-colors cursor-default select-none">
          Versão: {appVersion ? `v${appVersion}` : "Carregando..."}
        </span>
      </footer>
    </div>
  );
}