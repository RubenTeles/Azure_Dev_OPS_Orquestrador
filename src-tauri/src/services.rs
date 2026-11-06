use serde_json::{json, Value};
use std::{fs, path::PathBuf};

fn workspace_file(name: &str) -> PathBuf { std::env::current_dir().unwrap_or_default().join(name) }

#[tauri::command]
pub fn list_actions() -> Result<Value, String> {
    let path = workspace_file("actions/index.json");
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
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
