# Charts API 使用说明

## API 端点
`POST /api/charts`

## 功能
接收 ECharts 配置 JSON，生成图表图片并上传到 S3，返回 S3 图片 URL。**支持智能缓存，相同配置直接返回已存在的图片。**

## 请求参数

### Body (JSON)
```json
{
  "config": {
    // ECharts 配置对象
  },
  "width": 800,        // 可选，图片宽度，默认 800
  "height": 600,       // 可选，图片高度，默认 600
  "filename": "my-chart.png"  // 可选，自定义文件名前缀
}
```

## 响应格式

### 成功响应（新生成）
```json
{
  "success": true,
  "message": "Chart generated and uploaded successfully",
  "data": {
    "filename": "charts/chart-a1b2c3d4e5f6.png",
    "url": "https://parasail-static.s3.us-east-2.amazonaws.com/charts/chart-a1b2c3d4e5f6.png",
    "s3Key": "charts/chart-a1b2c3d4e5f6.png",
    "cached": false,
    "size": {
      "width": 800,
      "height": 600
    }
  }
}
```

### 成功响应（从缓存返回）
```json
{
  "success": true,
  "message": "Chart retrieved from cache",
  "data": {
    "filename": "charts/chart-a1b2c3d4e5f6.png",
    "url": "https://parasail-static.s3.us-east-2.amazonaws.com/charts/chart-a1b2c3d4e5f6.png",
    "s3Key": "charts/chart-a1b2c3d4e5f6.png",
    "cached": true,
    "size": {
      "width": 800,
      "height": 600
    }
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "Failed to generate chart",
  "message": "具体错误信息"
}
```

## 智能缓存机制

### 🚀 缓存原理
- **配置哈希**：基于 `config`、`width`、`height` 生成 MD5 哈希
- **固定文件名**：相同配置始终生成相同的文件名
- **存在性检查**：上传前先检查 S3 中是否已存在
- **直接返回**：如果存在，直接返回 URL，无需重新生成

### 📁 文件命名规则
```
charts/chart-{12位哈希}.png
charts/{自定义名}-{12位哈希}.png
```

### ⚡ 性能优势
- **避免重复计算**：相同配置不重复生成图表
- **减少 S3 请求**：不重复上传相同文件
- **快速响应**：缓存命中时响应更快
- **节省成本**：减少 S3 存储和计算成本

## 使用示例

### JavaScript/TypeScript 客户端调用
```javascript
const chartConfig = {
  title: { text: '销售数据' },
  xAxis: { data: ['Q1', 'Q2', 'Q3', 'Q4'] },
  yAxis: {},
  series: [{ type: 'bar', data: [100, 200, 150, 300] }]
}

// 第一次调用 - 生成新图片
const response1 = await fetch('/api/charts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: chartConfig,
    width: 1000,
    height: 600
  })
})

const result1 = await response1.json()
console.log('第一次调用:', result1.data.cached) // false

// 第二次调用相同配置 - 从缓存返回
const response2 = await fetch('/api/charts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: chartConfig,
    width: 1000,
    height: 600
  })
})

const result2 = await response2.json()
console.log('第二次调用:', result2.data.cached) // true
console.log('相同 URL:', result1.data.url === result2.data.url) // true
```

### 自定义文件名示例
```javascript
const response = await fetch('/api/charts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: chartConfig,
    width: 800,
    height: 600,
    filename: 'monthly-report' // 生成: charts/monthly-report-a1b2c3d4e5f6.png
  })
})
```

## 缓存策略说明

### ✅ 缓存条件
- **配置完全相同**：`config` 对象内容一致
- **尺寸相同**：`width` 和 `height` 相同
- **文件名前缀相同**：`filename` 参数相同

### 🔄 缓存失效
- **配置变化**：任何配置参数改变都会生成新文件
- **尺寸变化**：宽度或高度改变会生成新文件
- **手动删除**：从 S3 手动删除文件会重新生成

### 📊 缓存效果
```javascript
// 相同配置多次调用
const config = { /* 相同配置 */ }

// 第1次：生成 + 上传 (耗时: ~2-3秒)
// 第2次：缓存命中 (耗时: ~200-500ms)
// 第3次：缓存命中 (耗时: ~200-500ms)
// ...
```

## 最佳实践

### 🎯 推荐用法
1. **固定配置**：对于固定不变的图表，缓存效果最佳
2. **批量生成**：相同配置的图表可以并发请求
3. **预生成**：可以预先生成常用图表

### ⚠️ 注意事项
1. **配置敏感**：任何配置变化都会生成新文件
2. **存储成本**：长期使用会积累大量文件
3. **清理策略**：建议定期清理不用的图表文件

## 环境配置

确保以下环境变量已设置：
```bash
S3_AK=your_aws_access_key
S3_SK=your_aws_secret_key
BUCKET_NAME=your_s3_bucket_name
```

## 返回的 URL 格式
```
https://{bucket-name}.s3.{region}.amazonaws.com/charts/{filename}
```

例如：
```
https://parasail-static.s3.us-east-2.amazonaws.com/charts/chart-a1b2c3d4e5f6.png
```
