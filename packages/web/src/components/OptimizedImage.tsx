import { getOptimizedImageUrl, type ImageSizePreset } from '@/lib/imageOptimizer';

type OptimizedImageProps = {
  src: string;
  alt: string;
  preset: ImageSizePreset;
  className?: string;
  responsive?: boolean; // 是否使用响应式图片（mobile/desktop 不同尺寸）
}

export function OptimizedImage({ 
  src, 
  alt, 
  preset, 
  className = '',
  responsive = false
}: OptimizedImageProps) {
  if (!src) return null;

  const optimizedUrl = getOptimizedImageUrl(src, preset);

  // 如果启用响应式且是封面类型，使用 picture 元素
  if (responsive && (preset === 'mobile-cover' || preset === 'desktop-cover')) {
    const mobileUrl = getOptimizedImageUrl(src, 'mobile-cover');
    const desktopUrl = getOptimizedImageUrl(src, 'desktop-cover');

    return (
      <picture>
        <source media="(min-width: 768px)" srcSet={desktopUrl} />
        <img
          src={mobileUrl}
          alt={alt}
          className={className}
          loading="lazy"
        />
      </picture>
    );
  }

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}