pub mod commands;
pub mod features;
pub mod infrastructure;
pub mod models;
pub mod state;

use infrastructure::audio::{
    create_audio_queue, start_audio_engine, start_secondary_device, SampleCache,
};
use infrastructure::db::init_db;
use state::AudioState;
use std::sync::{mpsc, Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = create_audio_queue();
    let (sec_tx, sec_rx) = create_audio_queue();
    let (device_tx, device_rx) = mpsc::channel::<String>();

    std::thread::spawn(move || {
        let _stream = start_audio_engine(rx);
        loop {
            std::thread::park();
        }
    });

    std::thread::spawn(move || {
        let mut _current_stream: Option<cpal::Stream> = None;
        loop {
            if let Ok(device_name) = device_rx.recv() {
                _current_stream = None;
                if device_name != "default" {
                    match start_secondary_device(&device_name, sec_rx.clone()) {
                        Ok(stream) => {
                            _current_stream = Some(stream);
                            println!("Roteamento ativado para: {}", device_name);
                        }
                        Err(e) => eprintln!("Erro ao iniciar roteamento secundário: {}", e),
                    }
                } else {
                    println!("Roteamento secundário desativado.");
                }
            } else {
                break;
            }
        }
    });

    let audio_state = AudioState {
        sender: tx,
        cache: Arc::new(SampleCache::new()),
        secondary_sender: sec_tx,
        device_tx: Mutex::new(device_tx),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Proteção contra múltiplas instâncias
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            app.manage(audio_state);
            match init_db(app.handle()) {
                Ok(db_conn) => {
                    println!("Banco de dados SQLite inicializado! (Lazy Loading Pronto)");
                    app.manage(Mutex::new(db_conn));
                }
                Err(e) => eprintln!("Erro ao iniciar banco de dados: {}", e),
            }

            // LÓGICA DE INICIALIZAÇÃO SILENCIOSA (AUTOSTART)
            // Lê os argumentos que o Windows mandou ao abrir o app
            let args: Vec<String> = std::env::args().collect();

            // Se NÃO tiver o "--silently" (Ou seja, o usuário clicou no ícone)
            if !args.contains(&"--silently".to_string()) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            let show_i = MenuItem::with_id(app, "show", "Abrir Sonora", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Sair Totalmente", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)
                .expect("Falha ao criar o Tray Icon");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::soundboard::import_sound_file,
            commands::soundboard::play_sound,
            commands::soundboard::stop_all_sounds,
            commands::soundboard::stop_sound,
            commands::soundboard::save_sound_to_db,
            commands::soundboard::delete_sound_from_db,
            commands::soundboard::get_library,
            commands::soundboard::get_profiles,
            commands::soundboard::save_profile_to_db,
            commands::soundboard::delete_profile_from_db,
            commands::soundboard::set_sound_hotkey,
            commands::soundboard::crop_audio_file,
            commands::settings::set_master_volume,
            commands::settings::list_audio_devices,
            commands::settings::set_audio_route,
            commands::settings::get_settings_db,
            commands::settings::save_setting_db,
        ])
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--silently"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
