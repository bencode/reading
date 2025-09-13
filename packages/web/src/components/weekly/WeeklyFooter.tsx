import Link from 'next/link';

export default function WeeklyFooter() {
  return (
    <footer className="border-t bg-white mt-16">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            More Collections
          </Link>
          <Link href="/articles" className="hover:text-gray-900">
            All Articles
          </Link>
        </div>
      </div>
    </footer>
  );
}