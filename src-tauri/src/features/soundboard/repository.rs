use crate::models::{ProfileItem, SoundItem};
use rusqlite::{params, Connection, Result};

pub fn fetch_all_profiles(conn: &Connection) -> Result<Vec<ProfileItem>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name FROM categories")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![], |row| {
            Ok(ProfileItem {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut profiles = Vec::new();
    for row in rows {
        if let Ok(p) = row {
            profiles.push(p);
        }
    }
    Ok(profiles)
}

pub fn upsert_profile(conn: &Connection, id: &str, name: &str) -> Result<(), String> {
    conn.execute("INSERT INTO categories (id, name) VALUES (?1, ?2) ON CONFLICT(id) DO UPDATE SET name = excluded.name", params![id, name]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_profile(conn: &Connection, id: &str) -> Result<(), String> {
    let mut stmt = conn
        .prepare("SELECT filepath FROM sounds WHERE category_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![id], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut files_to_delete = Vec::new();
    for row_result in rows {
        if let Ok(path) = row_result {
            files_to_delete.push(path);
        }
    }

    conn.execute("DELETE FROM categories WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM sounds WHERE category_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    for filepath in files_to_delete {
        let _ = std::fs::remove_file(filepath);
    }
    Ok(())
}

pub fn insert_sound(
    conn: &Connection,
    id: &str,
    name: &str,
    filepath: &str,
    profile_id: &str,
) -> Result<(), String> {
    conn.execute(
        "INSERT INTO sounds (id, name, filepath, category_id) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, filepath, profile_id],
    )
    .map_err(|e| format!("Erro ao salvar no banco: {}", e))?;
    Ok(())
}

pub fn delete_sound(conn: &Connection, id: &str) -> Result<(), String> {
    let filepath: Result<String, _> = conn.query_row(
        "SELECT filepath FROM sounds WHERE id = ?1",
        params![id],
        |row| row.get(0),
    );
    conn.execute("DELETE FROM sounds WHERE id = ?1", params![id])
        .map_err(|e| format!("Erro ao apagar som: {}", e))?;
    if let Ok(path) = filepath {
        let _ = std::fs::remove_file(path);
    }
    Ok(())
}

pub fn fetch_all_sounds(conn: &Connection) -> Result<Vec<SoundItem>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, filepath, hotkey_code, category_id FROM sounds")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![], |row| {
            Ok(SoundItem {
                id: row.get(0)?,
                name: row.get(1)?,
                filepath: row.get(2)?,
                hotkey_code: row.get(3)?,
                profile_id: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut sounds = Vec::new();
    for row in rows {
        if let Ok(sound) = row {
            sounds.push(sound);
        }
    }
    Ok(sounds)
}

pub fn update_hotkey(conn: &Connection, id: &str, hotkey: Option<&str>) -> Result<(), String> {
    conn.execute(
        "UPDATE sounds SET hotkey_code = ?1 WHERE id = ?2",
        params![hotkey, id],
    )
    .map_err(|e| format!("Erro ao atualizar hotkey: {}", e))?;
    Ok(())
}

pub fn get_sound_filepath(conn: &Connection, id: &str) -> Result<String, String> {
    let mut stmt = conn
        .prepare("SELECT filepath FROM sounds WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    stmt.query_row([id], |row| row.get(0))
        .map_err(|_| "Áudio não encontrado no banco".to_string())
}
