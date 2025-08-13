import { getArticles, Article } from '../services/articleService';

export default async function Home() {
  const articles: Article[] = await getArticles();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Reading List</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        {articles.map((article) => (
          <div key={article.id} className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
              <p className="text-gray-600 text-sm mb-2">Source: {article.source_name} | Published: {new Date(article.published_at).toLocaleDateString()}</p>
              <p className="text-gray-700 mb-4">{article.summary}</p>
            </div>
            <div className="flex justify-between items-center">
              <a
                href={article.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Original
              </a>
              {/* TODO: Implement Mark as Read functionality */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}