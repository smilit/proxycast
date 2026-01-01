use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub server_config: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub enabled_proxycast: bool,
    #[serde(default)]
    pub enabled_claude: bool,
    #[serde(default)]
    pub enabled_codex: bool,
    #[serde(default)]
    pub enabled_gemini: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<i64>,
}

impl McpServer {
    #[allow(dead_code)]
    pub fn new(id: String, name: String, server_config: Value) -> Self {
        Self {
            id,
            name,
            server_config,
            description: None,
            enabled_proxycast: false,
            enabled_claude: false,
            enabled_codex: false,
            enabled_gemini: false,
            created_at: Some(chrono::Utc::now().timestamp()),
        }
    }
}
