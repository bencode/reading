type WeeklyCoverImageProps = {
  imageUrl: string;
  title: string;
};

export default function WeeklyCoverImage({ imageUrl, title }: WeeklyCoverImageProps) {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}