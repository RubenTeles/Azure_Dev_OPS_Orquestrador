use serde_json::Value;

pub trait Executor {
    fn id(&self) -> &'static str;
    fn execute(&self, inputs: &Value) -> Result<Value, String>;
}

pub struct PowerShellExecutor;
impl Executor for PowerShellExecutor {
    fn id(&self) -> &'static str { "powershell" }
    fn execute(&self, _inputs: &Value) -> Result<Value, String> { Err("PowerShell execution is disabled until configured by the user".into()) }
}

pub struct RestExecutor;
impl Executor for RestExecutor {
    fn id(&self) -> &'static str { "rest" }
    fn execute(&self, _inputs: &Value) -> Result<Value, String> { Err("REST execution is not configured".into()) }
}
