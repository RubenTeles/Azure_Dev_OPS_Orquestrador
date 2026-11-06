use serde::de::DeserializeOwned;
use std::{fs, path::PathBuf};

pub fn load_json<T: DeserializeOwned>(relative_path: &str) -> Result<T, String> {
    let path = PathBuf::from(relative_path);
    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

pub fn credential_target() -> &'static str { "DevOpsStudio/AzureDevOps" }
