import { useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        type="button"
        title="Configurações"
        onClick={() => navigate(location.pathname === "/settings" ? "/" : "/settings")}
        className={`p-3 rounded-2xl bg-[#0f0f0f] border border-[#222] hover:bg-[#1a1a1a] hover:border-[#333] transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] group flex items-center justify-center ${
          location.pathname === "/settings" ? "border-[#cda434]/40 bg-[#cda434]/10" : ""
        }`}
      >
        <Settings 
          size={24} 
          className={`transition-colors ${
            location.pathname === "/settings" ? "text-[#cda434]" : "text-white/50 group-hover:text-white"
          }`} 
        />
      </button>
    </div>
  );
}