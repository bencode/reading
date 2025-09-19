import Link from 'next/link';

export default function WeeklyFooter() {
  return (
    <footer className="border-t bg-white mt-8">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex justify-center gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            More Collections
          </Link>
        </div>
      </div>
    </footer>
  );
}