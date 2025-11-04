# AI Pictionary（AI 猜画）

一个基于 Next.js + TypeScript 的简易「你画我猜」应用：在画布上作画，服务端调用兼容 OpenAI 的接口进行识别并给出猜测与置信度。

## 快速开始
1. 安装依赖：npm install
2. 配置环境：在 .env.local 填写 OPENAI_BASE_URL、OPENAI_API_KEY、OPENAI_MODEL
3. 本地开发：npm run dev（默认 http://localhost:3000）

## 常用命令
- npm run dev：启动开发服务器（热更新）
- npm run build：生产构建
- npm run start：运行构建产物
- npm test：运行示例单元测试（使用 Vitest）

## 文档与规范
- 贡献者指南：参见 [AGENTS.md](./AGENTS.md)
- 目录结构：主要代码在 app/（页面与 API 路由），静态资源建议放在 public/

## 环境变量
- OPENAI_BASE_URL：兼容 OpenAI 的代理或服务地址
- OPENAI_API_KEY：鉴权密钥
- OPENAI_MODEL：模型名称（如 gpt-4o-mini）

提示：请勿将 .env.local 提交到仓库。
