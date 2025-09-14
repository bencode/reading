type ImageSize = {
  width: number;
  height: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export type ImageSizePreset = 
  | 'mobile-cover'    // 750x422 for mobile cover images (16:9)
  | 'desktop-cover'   // 1000x562 for desktop cover images (16:9)
  | 'thumbnail'       // 300x300 for thumbnails (2x)
  | 'medium'          // 800x800 for medium size
  | 'large'           // 1000x1000 for large size

const IMAGE_PRESETS: Record<ImageSizePreset, ImageSize> = {
  'mobile-cover': { width: 750, height: 422, quality: 80, format: 'webp' },
  'desktop-cover': { width: 1000, height: 562, quality: 80, format: 'webp' },
  'thumbnail': { width: 300, height: 300, quality: 75, format: 'webp' },
  'medium': { width: 800, height: 800, quality: 85, format: 'webp' },
  'large': { width: 1000, height: 1000, quality: 90, format: 'webp' }
}

function buildProcessParams(config: ImageSize): string {
  const parts: string[] = []
  
  // 构建 imgproxy 处理参数路径
  // 格式: resize:fill:width:height:enlarge/gravity:ce/quality:n/format:webp
  parts.push(`resize:fill:${config.width}:${config.height}:0`)
  parts.push('gravity:ce') // center gravity
  
  if (config.quality) {
    parts.push(`quality:${config.quality}`)
  }
  
  if (config.format) {
    parts.push(`format:${config.format}`)
  }
  
  return parts.join('/')
}

export function getOptimizedImageUrl(
  originalUrl: string, 
  preset: ImageSizePreset,
  options?: Partial<ImageSize>
): string {
  if (!originalUrl || !originalUrl.startsWith('/uploads/')) {
    return originalUrl
  }

  const presetConfig = IMAGE_PRESETS[preset]
  const config = { ...presetConfig, ...options }
  
  // 构建查询参数
  const processParams = buildProcessParams(config)
  const separator = originalUrl.includes('?') ? '&' : '?'
  
  return `${originalUrl}${separator}process=${encodeURIComponent(processParams)}`
}

export function getResponsiveImageUrls(originalUrl: string) {
  return {
    mobile: getOptimizedImageUrl(originalUrl, 'mobile-cover'),
    desktop: getOptimizedImageUrl(originalUrl, 'desktop-cover'),
    thumbnail: getOptimizedImageUrl(originalUrl, 'thumbnail')
  }
}