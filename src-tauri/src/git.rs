use std::path::Path;

pub trait GitService { fn clone_repository(&self, url: &str, destination: &Path) -> Result<(), String>; fn pull(&self, repository: &Path) -> Result<(), String>; fn push(&self, repository: &Path) -> Result<(), String>; }
pub struct LocalGitService;
impl GitService for LocalGitService {
    fn clone_repository(&self, _url: &str, _destination: &Path) -> Result<(), String> { Err("Git service is not configured".into()) }
    fn pull(&self, _repository: &Path) -> Result<(), String> { Err("Git service is not configured".into()) }
    fn push(&self, _repository: &Path) -> Result<(), String> { Err("Git service is not configured".into()) }
}
