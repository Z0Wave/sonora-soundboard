use rusqlite::{params, Connection, Result};
use std::fs;
use tauri::Manager;

pub fn init_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let db_path = app_dir.join("library.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color_hex TEXT DEFAULT '#FFFFFF',
            sort_order INTEGER DEFAULT 0
        )",
        params![],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sounds (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            filepath TEXT NOT NULL,
            category_id TEXT,
            base_volume REAL DEFAULT 1.0,
            hotkey_code TEXT,
            is_favorite BOOLEAN DEFAULT 0,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        )",
        params![],
    )
    .map_err(|e| e.to_string())?;

    // NOVA TABELA DE CONFIGURAÇÕES GERAIS
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        params![],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR IGNORE INTO categories (id, name) VALUES ('1', 'DEFAULT')",
        params![],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn)
}
