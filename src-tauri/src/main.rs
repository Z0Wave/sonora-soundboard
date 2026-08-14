// Impede que uma janela de terminal adicional seja aberta no Windows na versão final
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Acionar a função `run()` que está dentro do `lib.rs`
    sonora_lib::run();
}
