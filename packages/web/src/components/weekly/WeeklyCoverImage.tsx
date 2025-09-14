import { OptimizedImage } from '@/components/OptimizedImage';

type WeeklyCoverImageProps = {
  imageUrl: string;
  title: string;
};

export default function WeeklyCoverImage({ imageUrl, title }: WeeklyCoverImageProps) {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="w-full h-64 md:h-80 xl:h-96 rounded-lg overflow-hidden">
          <OptimizedImage
            src={imageUrl}
            alt={title}
            preset="mobile-cover"
            responsive
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}