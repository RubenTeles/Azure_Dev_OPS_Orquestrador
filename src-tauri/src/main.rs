#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod services;
mod azure;
mod config;
mod executors;
mod git;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![services::list_actions, services::save_workflow, services::execute_workflow, services::run_powershell_script])
        .run(tauri::generate_context!())
        .expect("error while running DevOps Studio");
}
