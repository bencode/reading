import Link from 'next/link';

export default function WeeklyFooter() {
  return (
    <footer className="bg-white border-t mt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Weekly Reading</h3>
            <p className="text-gray-600">Curated articles for thoughtful readers</p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              More Collections
            </Link>
            <Link href="/articles" className="text-gray-600 hover:text-gray-900">
              All Articles
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}