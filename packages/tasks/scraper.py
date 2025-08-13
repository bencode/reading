import feedparser

def fetch_rss_feed(feed_url):
    """
    Fetches and parses an RSS feed.
    """
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo:
            print(f"Error parsing feed {feed_url}: {feed.bozo_exception}")
            return None
        return feed
    except Exception as e:
        print(f"An error occurred while fetching the feed {feed_url}: {e}")
        return None

def main():
    """
    Main function to fetch and process articles.
    """
    # For now, we'll use a hardcoded RSS feed.
    # We can make this configurable later.
    hacker_news_feed = "https://news.ycombinator.com/rss"

    print(f"Fetching articles from {hacker_news_feed}...")
    feed = fetch_rss_feed(hacker_news_feed)

    if feed:
        for entry in feed.entries[:5]: # Print the 5 most recent articles
            print(f"- {entry.title}")

if __name__ == "__main__":
    main()
