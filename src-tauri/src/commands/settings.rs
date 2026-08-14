use crate::features::settings::repository;
use crate::infrastructure::audio;
use crate::models::AudioDeviceInfo;
use crate::state::AudioState;
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn list_audio_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    audio::get_output_devices()
}

#[tauri::command]
pub fn set_audio_route(state: State<'_, AudioState>, device_name: String) -> Result<(), String> {
    let tx = state.device_tx.lock().unwrap();
    tx.send(device_name).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_master_volume(state: State<'_, AudioState>, volume: f32) -> Result<(), String> {
    let _ = state
        .sender
        .send(audio::AudioCommand::SetMasterVolume(volume));
    let _ = state
        .secondary_sender
        .send(audio::AudioCommand::SetMasterVolume(volume));
    Ok(())
}

#[tauri::command]
pub fn get_settings_db(
    db: State<'_, Mutex<Connection>>,
) -> Result<HashMap<String, String>, String> {
    let conn = db.lock().unwrap();
    repository::get_all_settings(&conn)
}

#[tauri::command]
pub fn save_setting_db(
    db: State<'_, Mutex<Connection>>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = db.lock().unwrap();
    repository::upsert_setting(&conn, &key, &value)
}
