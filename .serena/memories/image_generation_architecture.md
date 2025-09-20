# Collection图片生成架构文档

## 概述
Collection编辑页面中有两个图片生成位置，都使用统一的ImagePicker组件实现智能图片生成功能。

## 两个图片生成位置

### 1. Cover Image (封面图片)
- **位置**: `packages/web/src/app/collections/components/CollectionForm/BasicInfoForm.tsx:81-90`
- **组件**: `ImagePicker`
- **上下文**: `Collection about: ${formData.title || 'various topics'}`
- **用途**: 为整个Collection提供封面图片

### 2. Section Image (章节图片)
- **位置**: `packages/web/src/app/collections/components/CollectionForm/ArticleSection.tsx:100-107`
- **组件**: `ImagePicker`
- **上下文**: `Article: ${section.article?.title || 'article'} from ${section.article?.source_name || 'source'}`
- **用途**: 为Collection中的单个章节/文章提供配图

## 核心组件架构

### ImagePicker组件
- **主文件**: `packages/web/src/components/ImagePicker/index.tsx`
- **子组件**: 
  - `ImagePreview` - 图片预览
  - `UrlInput` - URL输入
  - `FileUpload` - 文件上传
  - `AIGeneration` - AI生成界面
  - `DialogActions` - 对话框操作

### AI图片生成流程

#### 1. 智能提示词生成
- **API**: `/api/generate-prompt`
- **实现**: `packages/web/src/app/api/generate-prompt/route.ts`
- **依赖**: 
  - `LLM_API_ENDPOINT` - LLM服务端点
  - `LLM_API_KEY` - LLM API密钥
- **模型**: qwen-plus
- **逻辑**:
  1. 根据`label`判断图片类型(cover/section/general)
  2. 结合传入的`context`生成针对性提示词
  3. 使用专业的视觉描述规范

#### 2. 图片生成
- **API**: `/api/generate-image`
- **实现**: `packages/web/src/app/api/generate-image/route.ts`
- **依赖**: `DASHSCOPE_API_KEY` - 阿里云通义千问API密钥
- **服务**: DashScope API (https://dashscope.aliyuncs.com)
- **模型**: qwen-image
- **参数**:
  - 尺寸: 1328*1328像素 (正方形)
  - 无水印: `watermark: false`
  - 提示词扩展: `prompt_extend: true`
- **存储**: 
  1. 生成后自动下载到本地
  2. 保存到 `${UPLOAD_DIR}/generated-{timestamp}.png`
  3. 返回本地URL `/uploads/generated-{timestamp}.png`

## 技术特性

### 优势
- **组件复用**: Cover和Section使用同一个ImagePicker组件
- **上下文感知**: 根据不同场景生成适配的提示词
- **多输入方式**: AI生成 + URL输入 + 文件上传
- **智能化**: LLM辅助生成专业的视觉描述
- **本地化**: 生成图片保存在服务器本地，避免外链失效

### 环境变量依赖
```
LLM_API_ENDPOINT    # LLM服务端点
LLM_API_KEY         # LLM API密钥
DASHSCOPE_API_KEY   # 阿里云通义千问图片生成API
UPLOAD_DIR          # 上传目录(可选，默认public/uploads)
```

### 文件上传
- **API**: `/api/upload`
- **实现**: `packages/web/src/app/api/upload/route.ts`
- **支持**: 本地文件上传到服务器

## 优化空间

### 可能的改进方向
1. **缓存机制**: 相似prompt的生成结果缓存
2. **批量生成**: 同时为多个section生成图片
3. **样式模板**: 预设不同风格的生成模板
4. **图片质量**: 支持不同尺寸和质量选项
5. **用户偏好**: 记住用户的图片风格偏好
6. **预览优化**: 生成前预览不同风格选项

## 相关文件清单
```
packages/web/src/
├── components/ImagePicker/
│   ├── index.tsx                    # 主组件
│   ├── AIGeneration.tsx            # AI生成界面
│   ├── ImagePreview.tsx            # 图片预览
│   ├── UrlInput.tsx                # URL输入
│   ├── FileUpload.tsx              # 文件上传
│   └── DialogActions.tsx           # 对话框操作
├── app/collections/components/CollectionForm/
│   ├── BasicInfoForm.tsx           # Cover image使用位置
│   └── ArticleSection.tsx          # Section image使用位置
└── app/api/
    ├── generate-prompt/route.ts     # 智能提示词生成
    ├── generate-image/route.ts      # 图片生成
    └── upload/route.ts              # 文件上传
```