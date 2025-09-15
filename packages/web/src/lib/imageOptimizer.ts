type ImageSize = {
  width: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export type ResponsiveImageSize = 'small' | 'full';

type ResponsiveImageConfig = {
  mobile: { width: number; quality?: number };
  desktop: { width: number; quality?: number };
}

// WebP 支持检测
function supportsWebP(): boolean {
  if (typeof window === 'undefined') return true; // SSR 默认支持

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// 响应式图片尺寸配置
const RESPONSIVE_SIZES: Record<ResponsiveImageSize, ResponsiveImageConfig> = {
  small: {
    mobile: { width: 300, quality: 75 },
    desktop: { width: 400, quality: 80 }
  },
  full: {
    mobile: { width: 750, quality: 80 },
    desktop: { width: 1200, quality: 85 }
  }
};

function buildProcessParams(config: ImageSize, aspectRatio?: number): string {
  const parts: string[] = []
  const format = config.format || (supportsWebP() ? 'webp' : 'jpeg')

  // 构建 imgproxy 处理参数路径
  if (aspectRatio) {
    // 如果指定了长宽比，先设置crop_aspect_ratio，再resize
    parts.push(`crop_aspect_ratio:${aspectRatio}:true`)
  }

  // 使用 resize:fit 保持原图比例，高度设为0让其自动计算
  parts.push(`resize:fit:${config.width}:0`)
  parts.push('gravity:ce') // center gravity

  if (config.quality) {
    parts.push(`quality:${config.quality}`)
  }

  parts.push(`format:${format}`)

  return parts.join('/')
}

// 检测当前是否为移动设备
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false; // SSR 默认桌面端
  return window.innerWidth < 768;
}

// 响应式图片工具方法
export function getResponsiveImageConfig(
  originalUrl: string,
  size: ResponsiveImageSize,
  aspectRatio?: number
): string {
  if (!originalUrl || !originalUrl.startsWith('/uploads/')) {
    return originalUrl;
  }

  const sizeConfig = RESPONSIVE_SIZES[size]
  const isMobile = isMobileDevice()
  const config = isMobile ? sizeConfig.mobile : sizeConfig.desktop
  const separator = originalUrl.includes('?') ? '&' : '?'
  const format: 'webp' | 'jpeg' = supportsWebP() ? 'webp' : 'jpeg'

  const imageConfig: ImageSize = { ...config, format }
  const params = buildProcessParams(imageConfig, aspectRatio)

  return `${originalUrl}${separator}process=${params}`
}