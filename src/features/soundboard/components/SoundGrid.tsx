
import { Plus, Trash } from "lucide-react";
import { playSound } from "../services/soundboard.service";
import { formatHotkeyDisplay } from "@/shared/utils/hotkeys";

export function SoundGrid({ items, onAddClick, onDelete, onRecordHotkey, recordingId }: any) {
  return (
    <div className="grid grid-cols-6 gap-6 items-center">
      {items.map((item: any) => !item.isEmpty ? (
        <div key={item.id} className="flex flex-col items-center gap-4">
          <button type="button" onClick={() => playSound(item.id)} className="w-24 h-24 bg-[#1a1a1a] border border-[#222] rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 hover:border-[#cda434]/50 relative group">
            <span className="text-white text-xs truncate px-2">{item.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/20 rounded-md"><Trash size={12} /></button>
          </button>
          <button type="button" onClick={() => onRecordHotkey(item.id)} className={`text-xs font-mono cursor-pointer ${recordingId === item.id ? "text-[#cda434] animate-pulse" : "text-white/30"}`}>
            {recordingId === item.id ? "PRESS..." : formatHotkeyDisplay(item.hotkey_code || item.hotkey)}
          </button>
        </div>
      ) : (
        <div key={item.id} className="flex flex-col items-center gap-4">
          <button type="button" onClick={onAddClick} className="w-24 h-24 bg-[#1a1a1a] border border-[#222] hover:bg-[#222] rounded-2xl flex items-center justify-center cursor-pointer group">
            <Plus size={28} className="text-white/20 group-hover:text-white/60" />
          </button>
          <span className="text-transparent">-</span>
        </div>
      ))}
    </div>
  );
}