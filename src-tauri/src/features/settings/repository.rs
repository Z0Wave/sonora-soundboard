use rusqlite::{params, Connection, Result};
use std::collections::HashMap;

// Busca todas as configurações de uma vez e devolve como um Dicionário (HashMap)
pub fn get_all_settings(conn: &Connection) -> Result<HashMap<String, String>, String> {
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut settings_map = HashMap::new();
    for row in rows {
        if let Ok((key, value)) = row {
            settings_map.insert(key, value);
        }
    }

    Ok(settings_map)
}

// Salva ou atualiza uma configuração específica
pub fn upsert_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) 
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
