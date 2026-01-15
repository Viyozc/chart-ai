# Cloudflare Pages 部署指南

## 部署步骤

### 方法 1: 使用 Cloudflare Pages Dashboard（推荐）

1. 在 Cloudflare Dashboard 中创建新的 Pages 项目
2. 连接你的 Git 仓库
3. 配置构建设置：
   - **Build command**: `yarn build && yarn pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (项目根目录)

### 方法 2: 使用 Wrangler CLI

```bash
# 1. 构建项目
yarn build

# 2. 适配 Cloudflare Pages
yarn pages:build

# 3. 部署
yarn pages:deploy
```

## 重要注意事项

⚠️ **当前项目使用了 `canvas` 包，这在 Cloudflare Workers 环境中不支持！**

你需要：
1. 移除或替换 `canvas` 依赖
2. 修改 `pages/api/charts.ts` 使用 Cloudflare 兼容的图表生成方案
3. 考虑使用 Cloudflare Workers 调用外部图表生成服务

## 环境变量

在 Cloudflare Pages 中设置以下环境变量：
- `S3_AK`: AWS S3 Access Key
- `S3_SK`: AWS S3 Secret Key
- `BUCKET_NAME`: S3 Bucket 名称

