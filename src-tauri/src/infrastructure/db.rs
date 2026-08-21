
use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};
use lazy_static::lazy_static;
use std::fs;
use tauri::Manager;

lazy_static! {
    static ref MIGRATIONS: Migrations<'static> = Migrations::new(vec![
        M::up(
            "
            CREATE TABLE categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color_hex TEXT DEFAULT '#FFFFFF',
                sort_order INTEGER DEFAULT 0
            );

            CREATE TABLE sounds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                filepath TEXT NOT NULL,
                category_id TEXT,
                base_volume REAL DEFAULT 1.0,
                hotkey_code TEXT,
                is_favorite BOOLEAN DEFAULT 0,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
            );

            CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            INSERT INTO categories (id, name) VALUES ('1', 'DEFAULT');
            "
        ),
        // Quando for lançar a v0.2.0 com uma coluna nova, você vai criar a Versão 2 aqui.
    ]);
}

pub fn init_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    let db_path = app_dir.join("library.db");

    println!("ATENÇÃO: O BANCO ESTÁ SENDO LIDO NESTA PASTA: {:?}", db_path);
    
    let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(|e| format!("Erro ao ativar Foreign Keys: {}", e))?;

    // Executa as migrações. Ele lê o esquema do usuário e aplica o que falta.
    MIGRATIONS.to_latest(&mut conn)
        .map_err(|e| format!("Erro fatal ao migrar banco de dados: {}", e))?;

    Ok(conn)
}