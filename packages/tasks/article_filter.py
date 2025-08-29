"""Article content filtering module using LLM for quality assessment."""

import asyncio

import aiohttp
import requests


def get_llm_headers(api_key):
    """Get headers for LLM API requests."""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }


def build_article_filter_prompt(title, content):
    """Build prompt for article content filtering."""
    return f"""请判断以下文章是否符合技术博客/文章聚合的收录标准。

文章标题：{title}

文章内容摘要：{content[:1000]}...

收录标准：
1. 技术相关：编程、开发工具、软件工程、系统架构、数据科学等
2. 有实际价值：教程、经验分享、技术解析、工具介绍等
3. 内容深度：不是简单的新闻转载，有一定的技术深度
4. 非广告：不是纯粹的产品宣传或营销内容

不收录的内容：
- 纯新闻资讯（除非有技术分析）
- 招聘信息
- 产品营销广告
- 与技术无关的内容
- 过于简单的内容（如单纯的链接分享）

请只回答：ACCEPT 或 REJECT

如果回答ACCEPT，请简述理由（不超过50字）。
如果回答REJECT，请说明原因（不超过50字）。

格式：ACCEPT/REJECT: 理由"""


def filter_article_content(title, content, llm_config=None, verbose=True):
    """
    Filter article content using LLM to determine if it should be included.

    Args:
        title (str): Article title
        content (str): Article content
        llm_config (dict): LLM configuration with api_endpoint and api_key
        verbose (bool): Whether to print filtering progress

    Returns:
        tuple: (should_include: bool, reason: str)
    """
    if not llm_config or not llm_config.get("api_key"):
        if verbose:
            print("⚠ No LLM config provided, accepting all articles")
        return True, "No LLM filtering configured"

    if verbose:
        print(f"🔍 Filtering article: {title}")

    try:
        headers = get_llm_headers(llm_config["api_key"])
        prompt = build_article_filter_prompt(title, content)

        payload = {
            "model": "qwen-plus",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 200,
        }

        response = requests.post(llm_config["api_endpoint"], headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            llm_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            # Parse response
            if "ACCEPT" in llm_response.upper():
                reason = (
                    llm_response.split(":", 1)[1].strip()
                    if ":" in llm_response
                    else "Meets technical content criteria"
                )
                if verbose:
                    print(f"✅ Article accepted: {reason}")
                return True, reason
            else:
                reason = (
                    llm_response.split(":", 1)[1].strip() if ":" in llm_response else "Does not meet criteria"
                )
                if verbose:
                    print(f"❌ Article rejected: {reason}")
                return False, reason
        else:
            if verbose:
                print(f"⚠ LLM API error: {response.status_code}")
            return True, "LLM API error, accepting by default"

    except Exception as e:
        if verbose:
            print(f"⚠ Error in content filtering: {e}")
        return True, "Error in filtering, accepting by default"


async def filter_article_content_async(session, title, content, llm_config, semaphore):
    """
    Async version of filter_article_content for concurrent processing.
    """
    if not llm_config or not llm_config.get("api_key"):
        return True, "No LLM filtering configured"

    async with semaphore:  # Limit concurrent requests
        try:
            headers = get_llm_headers(llm_config["api_key"])
            prompt = build_article_filter_prompt(title, content)

            payload = {
                "model": "qwen-plus",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 200,
            }

            async with session.post(
                llm_config["api_endpoint"],
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    llm_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                    # Parse response
                    if "ACCEPT" in llm_response.upper():
                        reason = (
                            llm_response.split(":", 1)[1].strip()
                            if ":" in llm_response
                            else "Meets technical content criteria"
                        )
                        return True, reason
                    else:
                        reason = (
                            llm_response.split(":", 1)[1].strip()
                            if ":" in llm_response
                            else "Does not meet criteria"
                        )
                        return False, reason
                else:
                    return True, f"LLM API error: {response.status}"

        except Exception as e:
            return True, f"Error in filtering: {e}"


async def batch_filter_articles_async(articles, llm_config, batch_size=10, max_concurrent=5, verbose=True):
    """
    Async version with concurrent processing.

    Args:
        articles (list): List of article dicts with 'title' and 'content' keys
        llm_config (dict): LLM configuration
        batch_size (int): Number of articles to process before showing progress
        max_concurrent (int): Maximum concurrent requests
        verbose (bool): Whether to print progress

    Returns:
        tuple: (accepted_articles, rejected_articles)
    """
    if not articles:
        return [], []

    accepted = []
    rejected = []
    total = len(articles)
    semaphore = asyncio.Semaphore(max_concurrent)

    if verbose:
        print(f"🚀 Starting async batch filtering of {total} articles...")
        print(f"   Max concurrent requests: {max_concurrent}")

    async with aiohttp.ClientSession() as session:
        # Create tasks for all articles
        tasks = []
        for i, article in enumerate(articles):
            task = filter_article_content_async(
                session, article.get("title", ""), article.get("content", ""), llm_config, semaphore
            )
            tasks.append((i, article, task))

        # Process tasks in batches to show progress
        processed = 0
        for i in range(0, len(tasks), batch_size):
            batch_tasks = tasks[i : i + batch_size]

            # Wait for batch completion
            batch_results = await asyncio.gather(
                *[task for _, _, task in batch_tasks], return_exceptions=True
            )

            # Process results
            for j, (article_idx, article, _) in enumerate(batch_tasks):
                result = batch_results[j]

                if isinstance(result, Exception):
                    # Handle exception
                    accepted.append(article)
                    if verbose:
                        print(f"⚠ Error processing article {article['title']}: {result}")
                else:
                    should_include, reason = result
                    if should_include:
                        accepted.append(article)
                    else:
                        rejected.append((article, reason))

                processed += 1

            # Show progress
            if verbose:
                accepted_count = len(accepted)
                rejected_count = len(rejected)
                print(
                    f"📊 Progress: {processed}/{total} processed | "
                    f"✅ {accepted_count} accepted | "
                    f"❌ {rejected_count} rejected"
                )

    if verbose:
        final_accepted = len(accepted)
        final_rejected = len(rejected)
        print("\n🎉 Async batch filtering completed!")
        print(f"✅ Accepted: {final_accepted} articles")
        print(f"❌ Rejected: {final_rejected} articles")
        print(f"📊 Acceptance rate: {final_accepted/total*100:.1f}%")

    return accepted, rejected


def batch_filter_articles(articles, llm_config, batch_size=10, verbose=True):
    """
    Filter multiple articles with batch processing and progress reporting.

    Args:
        articles (list): List of article dicts with 'title' and 'content' keys
        llm_config (dict): LLM configuration
        batch_size (int): Number of articles to process before showing progress
        verbose (bool): Whether to print progress

    Returns:
        tuple: (accepted_articles, rejected_articles)
    """
    accepted = []
    rejected = []
    total = len(articles)

    if verbose:
        print(f"🚀 Starting batch filtering of {total} articles...")

    for i, article in enumerate(articles, 1):
        should_include, reason = filter_article_content(
            article.get("title", ""), article.get("content", ""), llm_config, verbose=False
        )

        if should_include:
            accepted.append(article)
        else:
            rejected.append((article, reason))

        # Show progress every batch_size articles
        if verbose and i % batch_size == 0:
            accepted_count = len(accepted)
            rejected_count = len(rejected)
            print(
                f"📊 Progress: {i}/{total} processed | "
                f"✅ {accepted_count} accepted | "
                f"❌ {rejected_count} rejected"
            )

    if verbose:
        final_accepted = len(accepted)
        final_rejected = len(rejected)
        print("\n🎉 Batch filtering completed!")
        print(f"✅ Accepted: {final_accepted} articles")
        print(f"❌ Rejected: {final_rejected} articles")
        print(f"📊 Acceptance rate: {final_accepted/total*100:.1f}%")

    return accepted, rejected
