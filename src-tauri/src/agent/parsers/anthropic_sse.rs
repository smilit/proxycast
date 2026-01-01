//! Anthropic SSE 流解析器
//!
//! 解析 Anthropic Messages API 的 Server-Sent Events 流

use crate::agent::types::{FunctionCall, TokenUsage, ToolCall};
use crate::models::anthropic::{AnthropicContentBlock, AnthropicDelta, AnthropicStreamEvent};
use tracing::{debug, warn};

/// Anthropic 工具调用构建器
#[derive(Debug, Clone, Default)]
struct AnthropicToolCallBuilder {
    id: String,
    name: String,
    input_json: String,
}

/// Anthropic SSE 流解析器
///
/// 解析 Anthropic Messages API 的 SSE 流
#[derive(Debug, Default)]
pub struct AnthropicSSEParser {
    /// 累积的完整内容
    full_content: String,
    /// 累积的工具调用
    tool_calls: Vec<ToolCall>,
    /// 当前正在构建的工具调用
    current_tool: Option<AnthropicToolCallBuilder>,
    /// Usage 信息
    usage: Option<TokenUsage>,
}

/// Anthropic SSE 解析结果
#[derive(Debug, Clone)]
pub struct AnthropicParseResult {
    /// 文本增量
    pub text_delta: Option<String>,
    /// 是否完成
    pub is_done: bool,
    /// 工具调用开始（id, name）
    pub tool_start: Option<(String, String)>,
}

impl AnthropicSSEParser {
    pub fn new() -> Self {
        Self::default()
    }

    /// 解析 SSE 数据行
    ///
    /// 返回解析结果
    pub fn parse_data(&mut self, data: &str) -> AnthropicParseResult {
        if data.trim().is_empty() {
            return AnthropicParseResult {
                text_delta: None,
                is_done: false,
                tool_start: None,
            };
        }

        let event: AnthropicStreamEvent = match serde_json::from_str(data) {
            Ok(e) => e,
            Err(e) => {
                warn!("[AnthropicSSEParser] 解析事件失败: {} - data: {}", e, data);
                return AnthropicParseResult {
                    text_delta: None,
                    is_done: false,
                    tool_start: None,
                };
            }
        };

        match event {
            AnthropicStreamEvent::MessageStart { message } => {
                debug!("[AnthropicSSEParser] 消息开始: id={}", message.id);
                AnthropicParseResult {
                    text_delta: None,
                    is_done: false,
                    tool_start: None,
                }
            }
            AnthropicStreamEvent::ContentBlockStart {
                index,
                content_block,
            } => match content_block {
                AnthropicContentBlock::ToolUse { id, name, .. } => {
                    debug!(
                        "[AnthropicSSEParser] 工具调用开始: id={}, name={}",
                        id, name
                    );
                    self.current_tool = Some(AnthropicToolCallBuilder {
                        id: id.clone(),
                        name: name.clone(),
                        input_json: String::new(),
                    });
                    AnthropicParseResult {
                        text_delta: None,
                        is_done: false,
                        tool_start: Some((id, name)),
                    }
                }
                AnthropicContentBlock::Text { .. } => {
                    debug!("[AnthropicSSEParser] 文本块开始: index={}", index);
                    AnthropicParseResult {
                        text_delta: None,
                        is_done: false,
                        tool_start: None,
                    }
                }
                _ => AnthropicParseResult {
                    text_delta: None,
                    is_done: false,
                    tool_start: None,
                },
            },
            AnthropicStreamEvent::ContentBlockDelta { index: _, delta } => match delta {
                AnthropicDelta::TextDelta { text } => {
                    self.full_content.push_str(&text);
                    AnthropicParseResult {
                        text_delta: Some(text),
                        is_done: false,
                        tool_start: None,
                    }
                }
                AnthropicDelta::InputJsonDelta { partial_json } => {
                    if let Some(ref mut tool) = self.current_tool {
                        tool.input_json.push_str(&partial_json);
                    }
                    AnthropicParseResult {
                        text_delta: None,
                        is_done: false,
                        tool_start: None,
                    }
                }
                AnthropicDelta::ThinkingDelta { thinking } => {
                    // 将思考内容添加到 full_content 中，用 <think> 标签包裹
                    let thinking_text = format!("<think>{}</think>", thinking);
                    self.full_content.push_str(&thinking_text);
                    AnthropicParseResult {
                        text_delta: None,
                        is_done: false,
                        tool_start: None,
                    }
                }
                AnthropicDelta::SignatureDelta { .. } => {
                    // 忽略签名 delta
                    AnthropicParseResult {
                        text_delta: None,
                        is_done: false,
                        tool_start: None,
                    }
                }
            },
            AnthropicStreamEvent::ContentBlockStop { index: _ } => {
                // 如果有正在构建的工具调用，完成它
                if let Some(tool) = self.current_tool.take() {
                    self.tool_calls.push(ToolCall {
                        id: tool.id,
                        call_type: "function".to_string(),
                        function: FunctionCall {
                            name: tool.name,
                            arguments: tool.input_json,
                        },
                    });
                }
                AnthropicParseResult {
                    text_delta: None,
                    is_done: false,
                    tool_start: None,
                }
            }
            AnthropicStreamEvent::MessageDelta { delta: _, usage } => {
                self.usage = Some(TokenUsage::new(usage.input_tokens, usage.output_tokens));
                AnthropicParseResult {
                    text_delta: None,
                    is_done: false,
                    tool_start: None,
                }
            }
            AnthropicStreamEvent::MessageStop => {
                debug!("[AnthropicSSEParser] 消息结束");
                AnthropicParseResult {
                    text_delta: None,
                    is_done: true,
                    tool_start: None,
                }
            }
        }
    }

    /// 完成解析，返回最终的工具调用列表
    pub fn finalize_tool_calls(&mut self) -> Vec<ToolCall> {
        std::mem::take(&mut self.tool_calls)
    }

    /// 获取完整内容
    pub fn get_full_content(&self) -> String {
        self.full_content.clone()
    }

    /// 是否有工具调用
    pub fn has_tool_calls(&self) -> bool {
        !self.tool_calls.is_empty() || self.current_tool.is_some()
    }

    /// 获取 usage
    pub fn get_usage(&self) -> Option<TokenUsage> {
        self.usage.clone()
    }
}
