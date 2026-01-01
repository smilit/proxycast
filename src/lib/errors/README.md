# errors

<!-- 一旦我所属的文件夹有所变化，请更新我 -->

## 架构说明

错误处理模块，提供结构化的错误类型定义、错误消息映射和错误处理工具函数。

## 文件索引

- `index.ts` - 模块导出入口
- `playwrightErrors.ts` - Playwright 登录错误处理
  - 错误类型枚举 `PlaywrightErrorType`
  - 错误信息接口 `PlaywrightErrorInfo`
  - 错误解析函数 `parsePlaywrightError`
  - 错误日志函数 `logPlaywrightError`

## 使用示例

```typescript
import { parsePlaywrightError, logPlaywrightError } from '@/lib/errors';

try {
  await startKiroPlaywrightLogin(provider, name);
} catch (e) {
  // 解析错误类型
  const errorInfo = parsePlaywrightError(e);
  
  // 记录详细日志
  logPlaywrightError('handlePlaywrightLogin', e, { provider });
  
  // 显示用户友好的错误消息
  setError(errorInfo.message);
}
```

## 相关需求

- Requirements 5.1: Playwright 启动失败错误处理
- Requirements 5.2: OAuth 超时错误处理
- Requirements 5.3: 用户取消错误处理
- Requirements 5.4: 详细错误日志记录

## 更新提醒

任何文件变更后，请更新此文档和相关的上级文档。
