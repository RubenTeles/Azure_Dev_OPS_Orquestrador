use serde_json::{json, Value};
use serde_json::{json, Value};
use std::{fs, path::PathBuf, process::Command};

fn workspace_file(name: &str) -> PathBuf {
    let relative = PathBuf::from(name);
    let mut candidates = vec![std::env::current_dir().unwrap_or_default(), std::env::current_exe().ok().and_then(|path| path.parent().map(PathBuf::from)).unwrap_or_default()];
    for base in candidates.drain(..) {
        let mut current = base;
        for _ in 0..6 {
            let candidate = current.join(&relative);
            if candidate.is_file() { return candidate; }
            if !current.pop() { break; }
        }
    }
    PathBuf::from(name)
}

#[tauri::command]
pub fn list_actions() -> Result<Value, String> {
    let path = workspace_file("actions/index.json");
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn run_powershell_script(script: String, args: Value) -> Result<String, String> {
    let script_path = workspace_file(&script);
    if !script_path.is_file() { return Err(format!("Script não encontrado: {}", script_path.display())); }
    let mut command = Command::new(if cfg!(target_os = "windows") { "powershell.exe" } else { "pwsh" });
    command.args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"])
        .arg(&script_path);
    if let Some(object) = args.as_object() {
        for (name, value) in object {
            command.arg(format!("-{name}"));
            if let Some(value) = value.as_str() { command.arg(value); }
            else if !value.is_null() { command.arg(value.to_string()); }
        }
    }
    let output = command.output().map_err(|e| format!("Falha ao iniciar PowerShell: {e}"))?;
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if error.is_empty() { format!("PowerShell terminou com o código {}", output.status) } else { error });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
pub fn save_workflow(workflow: Value) -> Result<(), String> {
    let id = workflow.get("id").and_then(Value::as_str).unwrap_or("workflow");
    let path = workspace_file(&format!("workflows/{id}.json"));
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    fs::write(path, serde_json::to_string_pretty(&workflow).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn execute_workflow(workflow: Value) -> Result<Vec<String>, String> {
    let nodes = workflow.get("nodes").and_then(Value::as_array).ok_or("Workflow has no nodes")?;
    Ok(nodes.iter().map(|node| format!("Completed node: {}", node.get("label").and_then(Value::as_str).unwrap_or("Unnamed"))).collect())
}

pub fn _status() -> Value { json!({"provider":"Azure DevOps","connected":false}) }
