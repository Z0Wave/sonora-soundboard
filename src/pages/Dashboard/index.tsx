
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Pen, Trash, Rocket } from "lucide-react";

// STORE
import { useSoundboardStore } from "@/features/soundboard/stores/soundboard.store";

// COMPONENTES E HOOKS
import { AddSoundModal } from "@/features/soundboard/components/AddSoundModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { UpdateModal } from "@/components/ui/UpdateModal";
import { SoundGrid } from "@/features/soundboard/components/SoundGrid";
import { useSoundActions } from "@/features/soundboard/hooks/useSoundActions";
import { useUpdater } from "@/features/updater/hooks/useUpdater";
import {
  saveProfileToDb,
  deleteProfileFromDb,
} from "@/features/soundboard/services/soundboard.service";

export default function Dashboard() {
  const {
    library,
    activeProfile,
    profiles,
    setProfiles,
    setActiveProfile,
    recordingHotkeyFor,
    setRecordingHotkeyFor,
  } = useSoundboardStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const soundActions = useSoundActions(
    activeProfile.id,
    setIsModalOpen
  );

  const updater = useUpdater();

  // Fecha menu de perfil ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Adiciona um novo perfil
  const handleAddProfile = async () => {
    const newNumber = profiles.length + 1;

    const formattedName =
      newNumber < 10 ? `0${newNumber}` : `${newNumber}`;

    const newProfile = {
      id: crypto.randomUUID(),
      name: formattedName,
    };

    await saveProfileToDb(newProfile.id, newProfile.name);

    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfile(newProfile);
    setIsProfileMenuOpen(false);
  };

  // Salva o nome do perfil
  const saveProfileName = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();

    if (tempProfileName.trim() === "") {
      setIsEditingProfile(false);
      return;
    }

    const newName = tempProfileName.toUpperCase();

    await saveProfileToDb(activeProfile.id, newName);

    setProfiles(
      profiles.map((profile) =>
        profile.id === activeProfile.id
          ? { ...profile, name: newName }
          : profile
      )
    );

    setActiveProfile({
      ...activeProfile,
      name: newName,
    });

    setIsEditingProfile(false);
  };

  // Apaga o perfil atual
  const handleDeleteProfileClick = async () => {
    if (
      profiles.length > 1 &&
      window.confirm(
        `Deseja apagar o perfil "${activeProfile.name}"?`
      )
    ) {
      await deleteProfileFromDb(activeProfile.id);

      const updatedProfiles = profiles.filter(
        (profile) => profile.id !== activeProfile.id
      );

      setProfiles(updatedProfiles);
      setActiveProfile(updatedProfiles[0]);
    }
  };

  // Sons pertencentes ao perfil ativo
  const activeLibrary = library.filter(
    (sound) => sound.profileId === activeProfile.id
  );

  // Preenche os espaços vazios do grid até 12 posições
  const paddedItems = [
    ...activeLibrary,
    ...Array.from(
      {
        length: Math.max(0, 12 - activeLibrary.length),
      },
      (_, i) => ({
        id: `empty-slot-${i}`,
        isEmpty: true,
      })
    ),
  ].slice(0, 12);

  return (
    <div className="h-full w-full flex flex-col font-sans select-none text-white">
      <PageHeader
        titlePrefix="SOUND /"
        hasUpdate={!!updater.updateInfo}
        onUpdateClick={() =>
          updater.setIsUpdateModalOpen(true)
        }
        isDownloadingUpdate={updater.isDownloadingUpdate}
        updateProgress={updater.updateProgress}
        titleHighlight={
          <div
            className="flex items-center gap-2 cursor-pointer relative"
            ref={dropdownRef}
          >
            {isEditingProfile ? (
              <form
                onSubmit={saveProfileName}
                className="pointer-events-auto flex items-center"
              >
                <input
                  autoFocus
                  value={tempProfileName}
                  onChange={(e) =>
                    setTempProfileName(e.target.value)
                  }
                  onBlur={() => void saveProfileName()}
                  className="bg-transparent text-[#cda434] font-bold italic text-xl w-32 border-b border-[#cda434] outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setIsProfileMenuOpen(!isProfileMenuOpen)
                }
                className="flex items-center gap-1 hover:text-[#cda434] transition-colors"
              >
                <span>{activeProfile.name}</span>

                <ChevronDown
                  size={20}
                  className={
                    isProfileMenuOpen ? "rotate-180" : ""
                  }
                />
              </button>
            )}

            {isProfileMenuOpen && (
              <div className="absolute top-full left-0 mt-4 w-48 bg-[#121212] border border-[#222] rounded-xl shadow-2xl py-2 z-50">
                {profiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={() => {
                      setActiveProfile(profile);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full px-5 py-2 text-sm ${
                      activeProfile.id === profile.id
                        ? "text-[#cda434]"
                        : "text-white/60"
                    }`}
                  >
                    {profile.name}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleAddProfile}
                  className="w-full px-5 py-2 text-xs uppercase text-white/40 hover:text-white"
                >
                  New Setup
                </button>
              </div>
            )}
          </div>
        }
        actionIcons={
          <>
            <button
              type="button"
              onClick={() => {
                setTempProfileName(activeProfile.name);
                setIsEditingProfile(true);
              }}
              className="p-2 text-white/60 hover:text-[#cda434]"
            >
              <Pen size={16} />
            </button>

            <button
              type="button"
              onClick={handleDeleteProfileClick}
              className="p-2 text-white/60 hover:text-red-500"
            >
              <Trash size={16} />
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col px-8">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full bg-[#121212] border border-[#222] rounded-3xl p-10 shadow-2xl">
            <SoundGrid
              items={paddedItems}
              onDelete={soundActions.handleDeleteSound}
              onRecordHotkey={setRecordingHotkeyFor}
              recordingId={recordingHotkeyFor}
              onAddClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* MODAL DE ADICIONAR SOM */}
      <AddSoundModal
        {...soundActions}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* MODAL DE ATUALIZAÇÃO */}
      <UpdateModal
        isOpen={updater.isUpdateModalOpen}
        onClose={() =>
          updater.setIsUpdateModalOpen(false)
        }
        updateInfo={updater.updateInfo}
        onStartUpdate={updater.handleStartUpdate}
      />

      {/* MODAL DE REINÍCIO TEMATIZADO */}
      {updater.isRestartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-[#121212] border border-[#333] rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 text-center items-center">
            <div className="w-16 h-16 bg-[#cda434]/10 text-[#cda434] rounded-full border border-[#cda434]/20 flex items-center justify-center mb-6 mx-auto">
              <Rocket size={32} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Atualização Concluída!
            </h2>

            <p className="text-sm text-white/60 mb-8">
              O download foi finalizado. Deseja reiniciar o
              Sonora agora para aplicar as novidades?
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  updater.setIsRestartModalOpen(false);
                  updater.setUpdateInfo(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold uppercase bg-[#1a1a1a] text-white/60 border border-[#333]"
              >
                Mais Tarde
              </button>

              <button
                type="button"
                onClick={() => {

                  // Aplica a atualização que já foi baixada!
                  updater.updateInfo?.install();
                }}
                className="flex-1 py-3 rounded-xl font-bold uppercase bg-[#cda434] text-black"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}