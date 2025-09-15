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

  const optimizedUrl = getResponsiveImageConfig(src, size, ratio);

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}