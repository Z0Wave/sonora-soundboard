
import { ReactNode } from 'react';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, X, Loader2 } from "lucide-react";
import { UpdateIcon } from "@/components/icons/UpdateIcon"; 

type PageHeaderProps = Readonly<{
  titlePrefix: string;     
  titleHighlight?: ReactNode; 
  actionIcons?: ReactNode;    
  children?: ReactNode;       
  hasUpdate?: boolean;
  onUpdateClick?: () => void;
  // NOVAS PROPS:
  isDownloadingUpdate?: boolean;
  updateProgress?: string;
}>;

export function PageHeader ({ titlePrefix, titleHighlight, actionIcons, children, hasUpdate, onUpdateClick, isDownloadingUpdate, updateProgress }: PageHeaderProps) {
  const appWindow = getCurrentWindow();

  return (
    <div data-tauri-drag-region className="w-full h-12 shrink-0 flex justify-between items-center border-b border-[#222] pl-4 pr-4 bg-[#000000] select-none">
      
      {/* ÁREA ESQUERDA */}
      <div data-tauri-drag-region className="flex items-center gap-4 flex-1 h-full">
        <h1 data-tauri-drag-region className="text-lg sm:text-xl font-serif italic text-white/30 uppercase tracking-widest flex items-center whitespace-nowrap pointer-events-none">
          {titlePrefix} 
          {titleHighlight && (
            <span className="text-[#cda434] ml-2 flex items-center pointer-events-auto no-drag">
              {titleHighlight}
            </span>
          )}
        </h1>
        
        {actionIcons && (
          <div className="flex items-center gap-1 mt-1 opacity-50 hover:opacity-100 transition-opacity pointer-events-auto no-drag">
            {actionIcons}
          </div>
        )}
      </div>

      {/* ÁREA DIREITA (Extras + Botões da Janela e Update) */}
      <div data-tauri-drag-region className="flex items-center justify-end gap-6 flex-1 h-full">
        
        {children && (
          <div className="pointer-events-auto no-drag">
            {children}
          </div>
        )}

        <div className="flex items-center gap-4 pointer-events-auto no-drag">
          
          {/* LÓGICA DO ÍCONE DE ATUALIZAÇÃO */}
          
          {isDownloadingUpdate && (
            <div className="flex items-center gap-2 text-[#cda434] bg-[#cda434]/10 px-3 py-1.5 rounded-full border border-[#cda434]/20" title="Baixando Atualização no fundo...">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold tracking-widest">{updateProgress}</span>
            </div>
          )}

          {!isDownloadingUpdate && hasUpdate && (
            <button type="button" onClick={onUpdateClick} className="text-[#cda434] hover:text-white transition-colors cursor-pointer animate-pulse" title="Atualização Disponível!">
              <UpdateIcon className="w-5 h-5" />
            </button>
          )}

          {/* BOTOES DA JANELA */}
          <div className="flex bg-[#121212] border border-[#222] rounded-md overflow-hidden shrink-0">
            <button type="button" onClick={() => appWindow.minimize()} className="px-3 py-2 text-white/80 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer">
              <Minus size={16} />
            </button>
            <button type="button" onClick={() => appWindow.hide()} className="px-3 py-2 text-white/60 hover:text-red-500 hover:bg-[#1a1a1a] transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}