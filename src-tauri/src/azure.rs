use serde_json::Value;

pub struct AzureDevOpsClient { pub organization: String }
impl AzureDevOpsClient {
    pub fn new(organization: String) -> Self { Self { organization } }
    pub fn list_projects(&self) -> Result<Value, String> { Ok(Value::Array(vec![])) }
    pub fn list_repositories(&self) -> Result<Value, String> { Ok(Value::Array(vec![])) }
    pub fn list_pipelines(&self) -> Result<Value, String> { Ok(Value::Array(vec![])) }
    pub fn list_environments(&self) -> Result<Value, String> { Ok(Value::Array(vec![])) }
}
