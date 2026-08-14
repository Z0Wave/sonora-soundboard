
import { X, Download, Rocket, Bug, AlertTriangle, HardDrive, Calendar } from "lucide-react";
import type { Update } from "@tauri-apps/plugin-updater";

type UpdateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: Update | null;
  onStartUpdate: () => void; // AVISO NOVO PARA O DASHBOARD
};

const parseReleaseNotes = (safeText = "") => {
  return {
    size: new RegExp(/\[SIZE\](.*?)\[\/SIZE\]/is).exec(safeText)?.[1].trim(),
    date: new RegExp(/\[DATE\](.*?)\[\/DATE\]/is).exec(safeText)?.[1].trim(),
    news: new RegExp(/\[NOVIDADES\](.*?)\[\/NOVIDADES\]/is).exec(safeText)?.[1].trim(),
    fixes: new RegExp(/\[CORRECOES\](.*?)\[\/CORRECOES\]/is).exec(safeText)?.[1].trim(),
    warnings: new RegExp(/\[AVISOS\](.*?)\[\/AVISOS\]/is).exec(safeText)?.[1].trim(),
    raw: !safeText.includes("[NOVIDADES]") && !safeText.includes("[CORRECOES]") ? safeText : null,
  };
};

export function UpdateModal({ isOpen, onClose, updateInfo, onStartUpdate }: Readonly<UpdateModalProps>) {
  if (!isOpen || !updateInfo) return null;

  const notes = parseReleaseNotes(updateInfo.body || "");

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-[#121212] border border-[#333] rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-start justify-between p-6 border-b border-[#222] bg-[#161616]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-wide">Atualização Disponível</h2>
              <span className="bg-[#cda434]/20 text-[#cda434] px-2 py-0.5 rounded text-xs font-bold border border-[#cda434]/30">v{updateInfo.version}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-white/40">
              {notes.size && <div className="flex items-center gap-1.5"><HardDrive size={14} /> {notes.size}</div>}
              {notes.date && <div className="flex items-center gap-1.5"><Calendar size={14} /> {notes.date}</div>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-[#222] rounded-xl transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 min-h-64 max-h-104 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#444] transition-colors">
          {notes.raw && <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{notes.raw}</p>}
          {notes.warnings && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Atenção</h3>
              <p className="text-sm text-red-200/80 whitespace-pre-wrap leading-relaxed">{notes.warnings}</p>
            </div>
          )}
          {notes.news && (
            <div className="bg-[#cda434]/5 border border-[#cda434]/10 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-[#cda434] uppercase tracking-widest mb-2 flex items-center gap-2"><Rocket size={14} /> Novidades</h3>
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{notes.news}</p>
            </div>
          )}
          {notes.fixes && (
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Bug size={14} /> Correções</h3>
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{notes.fixes}</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 bg-[#161616] border-t border-[#222]">
          <button type="button" onClick={onStartUpdate} className="w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3 bg-[#cda434] text-black hover:bg-[#b58f2b] hover:shadow-[0_0_20px_rgba(205,164,52,0.3)] cursor-pointer">
            <Download size={18} /> Baixar e Instalar
          </button>
        </div>
      </div>
    </div>
  );
}