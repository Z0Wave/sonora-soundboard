use crate::features::soundboard::repository;
use crate::infrastructure::audio::{self, AudioCommand};
use crate::models::{ProfileItem, SoundItem};
use crate::state::AudioState;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

#[tauri::command]
pub fn import_sound_file(
    state: State<'_, AudioState>,
    file_path: String,
) -> Result<String, String> {
    let new_id = Uuid::new_v4();
    state.cache.load_file(new_id, &file_path)?;
    Ok(new_id.to_string())
}

#[tauri::command]
pub fn play_sound(
    state: State<'_, AudioState>,
    db_state: State<'_, Mutex<Connection>>,
    sound_id: String,
) -> Result<(), String> {
    let id = Uuid::parse_str(&sound_id).map_err(|_| "ID Inválido")?;

    if state.cache.samples.get(&id).is_none() {
        println!("Lazy Load: Som não encontrado na RAM. Buscando do disco...");
        let filepath = {
            let conn = db_state.lock().unwrap();
            repository::get_sound_filepath(&conn, &sound_id)?
        };
        state
            .cache
            .load_file(id, &filepath)
            .map_err(|e| format!("Erro ao carregar: {}", e))?;
    }

    if let Some(sample_ref) = state.cache.samples.get(&id) {
        let cmd = AudioCommand::Play {
            id: Uuid::new_v4(),
            sample: sample_ref.clone(),
            volume: 1.0,
        };
        let _ = state.sender.send(cmd.clone());
        let _ = state.secondary_sender.send(cmd);
        Ok(())
    } else {
        Err("Falha catastrófica".to_string())
    }
}

#[tauri::command]
pub fn stop_all_sounds(state: State<'_, AudioState>) -> Result<(), String> {
    let _ = state.sender.send(AudioCommand::StopAll);
    let _ = state.secondary_sender.send(AudioCommand::StopAll);
    Ok(())
}

#[tauri::command]
pub fn stop_sound(state: State<'_, AudioState>, sound_id: String) -> Result<(), String> {
    let id = Uuid::parse_str(&sound_id).map_err(|_| "ID Inválido")?;
    let _ = state.sender.send(AudioCommand::Stop(id));
    let _ = state.secondary_sender.send(AudioCommand::Stop(id));
    Ok(())
}

#[tauri::command]
pub fn get_profiles(db: State<'_, Mutex<Connection>>) -> Result<Vec<ProfileItem>, String> {
    let conn = db.lock().unwrap();
    repository::fetch_all_profiles(&conn)
}

#[tauri::command]
pub fn save_profile_to_db(
    db: State<'_, Mutex<Connection>>,
    id: String,
    name: String,
) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::upsert_profile(&conn, &id, &name)
}

#[tauri::command]
pub fn delete_profile_from_db(db: State<'_, Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::delete_profile(&conn, &id)
}

#[tauri::command]
pub fn save_sound_to_db(
    db: State<'_, Mutex<Connection>>,
    id: String,
    name: String,
    filepath: String,
    profile_id: String,
) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::insert_sound(&conn, &id, &name, &filepath, &profile_id)
}

#[tauri::command]
pub fn delete_sound_from_db(db: State<'_, Mutex<Connection>>, id: String) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::delete_sound(&conn, &id)
}

#[tauri::command]
pub fn get_library(db: State<'_, Mutex<Connection>>) -> Result<Vec<SoundItem>, String> {
    let conn = db.lock().unwrap();
    repository::fetch_all_sounds(&conn)
}

#[tauri::command]
pub fn set_sound_hotkey(
    db: State<'_, Mutex<Connection>>,
    id: String,
    hotkey: Option<String>,
) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::update_hotkey(&conn, &id, hotkey.as_deref())
}

#[tauri::command]
pub fn crop_audio_file(
    app_handle: AppHandle,
    input_path: String,
    start_sec: f32,
    end_sec: f32,
    volume: f32,
) -> Result<String, String> {
    let new_id = Uuid::new_v4().to_string();
    let mut out_path = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "Falha ao obter diretório de dados".to_string())?;
    std::fs::create_dir_all(&out_path).map_err(|e| format!("Erro ao criar diretório: {}", e))?;
    out_path.push(format!("{}.wav", new_id));
    let output_str = out_path.to_str().ok_or("Erro de codificação de caminho")?;
    audio::crop_and_save(&input_path, output_str, start_sec, end_sec, volume)?;
    Ok(output_str.to_string())
}
