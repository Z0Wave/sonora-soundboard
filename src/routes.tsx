
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout"; 
import Dashboard from "@/pages/Dashboard"; 
import { SettingsScreen } from "@/features/settings/components/SettingsScreen";
import { PageHeader } from "@/components/ui/PageHeader";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "mixer",
        element: (
          <div className="h-full w-full flex flex-col font-sans text-white">
            <PageHeader titlePrefix="AUDIO /" titleHighlight={<span className="text-[#cda434]">MIXER</span>} />
            <div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest">
              Em breve: Controle de Volumes
            </div>
          </div>
        ),
      },
      {
        path: "hotkeys",
        element: (
          <div className="h-full w-full flex flex-col font-sans text-white">
            <PageHeader titlePrefix="GLOBAL /" titleHighlight={<span className="text-[#cda434]">HOTKEYS</span>} />
            <div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest">
              Em breve: Gerenciador de Atalhos
            </div>
          </div>
        ),
      },
      {
        path: "settings",
        element: <SettingsScreen />,
      },
    ],
  },
]);