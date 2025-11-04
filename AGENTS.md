# Repository Guidelines

## 项目结构与模块组织
- app/: Next.js App Router，页面在 app/page.tsx，布局在 app/layout.tsx；后端接口 app/api/guess/route.ts。
- public/: 静态资源（如图标、favicon），不存在可自行创建。
- .env.local: 本地环境变量（OPENAI_BASE_URL、OPENAI_API_KEY、OPENAI_MODEL）。
- .next/、node_modules/: 生成目录，不要提交。

## 构建、测试与本地开发
- npm run dev: 本地开发，http://localhost:3000，支持热更新。
- npm run build: 生产构建。
- npm run start: 启动构建产物（需先 build）。

## 代码风格与命名
- TypeScript 开启严格模式；提交前修复类型错误。
- 缩进 2 空格；保留分号；优先单引号。
- 组件使用 PascalCase；hook 用 camelCase；页面文件为 page.tsx；API 为 route.ts。
- 仅在需要的组件标注 "use client"；服务端逻辑放在 API 或服务端组件。

## 测试规范
- 目前未集成测试。建议新增：Vitest/Jest（单元），Playwright（端到端）。
- 测试放在 __tests__/ 或同文件旁；命名 *.test.ts(x)。
- 在 package.json 添加脚本，例如 "test": "vitest"。

## 提交与合并请求
- 暂无既定格式，推荐 Conventional Commits：feat:/fix:/docs:/refactor:/chore:/test:。
- PR 需包含：变更说明、关联 issue、UI 截图（如有）、环境/配置变更说明与验证步骤。

## 安全与配置
- 机密不要入库；使用 .env.local（已忽略）。必需：OPENAI_BASE_URL、OPENAI_API_KEY、OPENAI_MODEL。
- 不要直接改动 .next/ 与 node_modules/；主要修改 app/ 与配置文件。

## 架构概览
- 画板将 PNG(base64) 发送到 /api/guess；服务端转发至兼容 OpenAI 的 Chat Completions，返回 { guess, confidence }。
