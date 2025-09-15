import { getResponsiveImageConfig, type ResponsiveImageSize } from '@/lib/imageOptimizer';

type OptimizedImageProps = {
  src: string;
  alt: string;
  size: ResponsiveImageSize;
  ratio?: number;
  className?: string;
};

export function OptimizedImage({
  src,
  alt,
  size,
  ratio,
  className = ''
}: OptimizedImageProps) {
  if (!src) return null;

  const { mobileUrl, desktopUrl } = getResponsiveImageConfig(src, size, ratio);

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