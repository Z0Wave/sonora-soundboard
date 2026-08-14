
import { X, Upload } from "lucide-react";

interface AddSoundModalProps {
  isOpen: boolean;
  onClose: () => void;

  filePath: string;
  soundName: string;
  setSoundName: (val: string) => void;

  soundVolume: number;
  setSoundVolume: (val: number) => void;

  isSaving?: boolean;

  handleBrowseFile: () => void;
  handleSaveSound: () => void;
}

export function AddSoundModal({
  isOpen,
  onClose,
  filePath,
  soundName,
  setSoundName,
  soundVolume,
  setSoundVolume,
  isSaving = false,
  handleBrowseFile,
  handleSaveSound,
}: Readonly<AddSoundModalProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#121212] rounded-2xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(205,164,52,0.05)] border border-[#222]">
        {/* HEADER DO MODAL */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#222]">
          <h2 className="text-lg font-bold text-white tracking-widest uppercase">
            Adicionar Áudio
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-white/50 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* ESCOLHER ARQUIVO */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">
              Arquivo{" "}
              <span className="text-[#cda434]">*</span>
            </label>

            <div className="flex bg-[#000000] border border-[#222] rounded-xl p-1.5 focus-within:border-[#cda434] transition-colors">
              <div className="flex-1 flex items-center gap-3 px-3 overflow-hidden cursor-default">
                <Upload
                  size={18}
                  className="text-white/40 shrink-0"
                />

                <span className="text-white/70 text-sm truncate">
                  {filePath
                    ? filePath.split(/[/\\]/).pop()
                    : "Selecione o arquivo..."}
                </span>
              </div>

              <button
                type="button"
                onClick={handleBrowseFile}
                disabled={isSaving}
                className="bg-[#1a1a1a] hover:bg-[#cda434] text-white hover:text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer disabled:opacity-30"
              >
                Navegar
              </button>
            </div>
          </div>

          {/* VOLUME */}
          {filePath && (
            <div className="flex flex-col gap-4 bg-[#000000] p-4 rounded-xl border border-[#222]">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-white/50 uppercase">
                    Volume (Aumento)
                  </label>

                  <span className="text-xs font-mono text-[#cda434]">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={soundVolume}
                  disabled={isSaving}
                  onChange={(e) =>
                    setSoundVolume(
                      Number.parseFloat(e.target.value)
                    )
                  }
                  className="w-full accent-[#cda434]"
                />
              </div>
            </div>
          )}

          {/* NOME DO SOM */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">
              Nome do Som no Grid{" "}
              <span className="text-[#cda434]">*</span>
            </label>

            <input
              value={soundName}
              disabled={isSaving}
              onChange={(e) =>
                setSoundName(e.target.value)
              }
              placeholder="Ex: Risada"
              className="w-full bg-[#000000] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#cda434] transition-colors disabled:opacity-50"
            />
          </div>

          {/* BOTÕES */}
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-30"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                !filePath ||
                !soundName.trim() ||
                isSaving
              }
              onClick={handleSaveSound}
              className="flex-1 bg-[#cda434] hover:bg-[#b5902d] text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? "SALVANDO..." : "Salvar Áudio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}