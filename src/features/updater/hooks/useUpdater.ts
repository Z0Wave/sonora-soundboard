
import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import type { Update } from "@tauri-apps/plugin-updater";


export function useUpdater() {
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState("");
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);

  // CHECADOR DE ATUALIZAÇÕES SILENCIOSO 
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
        }
      } catch (error) {
        console.error("Erro ao buscar atualizações:", error);
      }
    };
    
    const timer = setTimeout(checkForUpdates, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartUpdate = async () => {
    if (!updateInfo) return;
    setIsUpdateModalOpen(false); 
    setIsDownloadingUpdate(true);
    setUpdateProgress("0%");

    try {
      let downloaded = 0;
      let total = 0;
      
      await updateInfo.download((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const percent = Math.round((downloaded / total) * 100);
              setUpdateProgress(`${percent}%`);
            } else {
              setUpdateProgress("...");
            }
            break;
          case 'Finished':
            setUpdateProgress("100%");
            break;
        }
      });

      // Agora o download terminará silenciosamente e o seu modal finalmente vai aparecer!
      setIsDownloadingUpdate(false);
      setIsRestartModalOpen(true); 

    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Falha ao baixar atualização. Tente novamente mais tarde.");
      setIsDownloadingUpdate(false);
    }
  };

  return {
    updateInfo,
    setUpdateInfo,
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    isDownloadingUpdate,
    updateProgress,
    isRestartModalOpen,
    setIsRestartModalOpen,
    handleStartUpdate
  };
}