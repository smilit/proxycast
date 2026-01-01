#!/bin/bash

# 测试流式响应脚本

API_KEY="${1:-your-api-key}"
HOST="${2:-localhost:8999}"

echo "测试流式响应..."
echo "API Key: $API_KEY"
echo "Host: $HOST"
echo ""

# 发送流式请求
curl -N -X POST "http://$HOST/v1/messages" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4-5-20251101",
    "max_tokens": 2048,
    "stream": true,
    "messages": [
      {"role": "user", "content": "请给我讲一个500字的笑话，要完整讲完"}
    ]
  }' 2>&1 | tee stream_output.log

echo ""
echo "输出已保存到 stream_output.log"
echo "检查是否有 message_stop 事件..."
grep "message_stop" stream_output.log && echo "✓ 流正常结束" || echo "✗ 流被截断"
