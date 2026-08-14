
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

import {
  cropAudioFile,
  saveSoundToDb,
  deleteSoundFromDb,
  stopSound,
} from "../services/soundboard.service";

import { useSoundboardStore } from "../stores/soundboard.store";

export function useSoundActions(
  activeProfileId: string,
  setIsModalOpen: (value: boolean) => void
) {
  const { setLibrary } = useSoundboardStore();

  const [filePath, setFilePath] = useState("");
  const [soundName, setSoundName] = useState("");
  const [soundVolume, setSoundVolume] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleBrowseFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Áudio",
          extensions: ["mp3", "wav"],
        },
      ],
    });

    if (selected && typeof selected === "string") {
      setFilePath(selected);

      const fileName =
        selected
          .split(/[\\/]/)
          .pop()
          ?.replace(/\.[^/.]+$/, "") ?? "";

      setSoundName(fileName);
    }
  };

  const handleSaveSound = async () => {
    if (!filePath || !soundName.trim() || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      /*
       * Corte padrão:
       * início: 0 segundos
       * fim: 10 segundos
       *
       * O volume vem diretamente do slider do AddSoundModal.
       */
      const croppedPath = await cropAudioFile(
        filePath,
        0,
        10,
        soundVolume
      );

      const newId = crypto.randomUUID();

      await saveSoundToDb(
        newId,
        soundName.trim(),
        croppedPath,
        activeProfileId
      );

      setLibrary((prev) => [
        ...prev,
        {
          id: newId,
          name: soundName.trim(),
          filepath: croppedPath,
          profileId: activeProfileId,
        },
      ]);

      setIsModalOpen(false);

      setFilePath("");
      setSoundName("");
      setSoundVolume(1);
    } catch {
      window.alert("Falha ao salvar o áudio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSound = async (id: string) => {
    await deleteSoundFromDb(id);

    setLibrary((prev) =>
      prev.filter((sound) => sound.id !== id)
    );

    stopSound(id).catch(() => {});
  };

  return {
    filePath,
    soundName,
    setSoundName,

    soundVolume,
    setSoundVolume,

    isSaving,

    handleBrowseFile,
    handleSaveSound,
    handleDeleteSound,
  };
}