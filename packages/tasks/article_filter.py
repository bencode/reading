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
    return f"""你是一个高标准的技术文章筛选专家。请判断以下文章是否值得深度阅读并收录到精选技术周刊。

文章标题：{title}

文章内容摘要：{content[:1500]}

**收录标准（必须同时满足）：**
1. 有独到见解或深入分析：包含原创思考、技术原理剖析、架构决策推演、实践经验总结
2. 技术深度：涉及编程技艺、系统设计、算法原理、工程实践等，有实质性的技术内容
3. 值得花10分钟以上阅读：内容丰富、有信息密度，读后有收获

**读者画像（用于加权，不是话题白名单）：**
本周刊读者是一名资深工程师，**深度关注方向**为：LLM / Agent 工程、RAG / IR 系统、企业级应用架构、先进软件开发实践。
读者**同时持续关注**：前端与 Web 平台、JavaScript / TypeScript、Python、Rust、Go、数据库与数据工程、云原生、操作系统与系统编程、编译器与编程语言、开发者工具链 —— 这些都是合法话题，不是"不相关"。

**怎么使用画像（关键）：**
- 画像**不是**话题白名单。一篇高质量的前端 / SQLite / 调试技巧 / Python 工程实践 / Rust 异步 / 内核机制文章，**不需要**和 LLM/Agent/RAG 沾边就可以 ACCEPT。
- 画像的作用是 **加权而非门槛**：
  - 命中"深度关注方向"的优质内容 → 优先 ACCEPT（即便深度略低也予以倾斜）
  - 命中"同时持续关注"方向的优质工程内容 → 按通用标准（独到见解 / 技术深度 / 信息密度）评判，**不因"未涉及 LLM/Agent/RAG"而 REJECT**
  - 偏离工程方向的纯理论 / 纯算法论文 → 按下方"论文规则"

**对论文 / 研究类内容的特别规则：**
- ACCEPT：涉及生产部署、工程实现细节、可复用方法论、工程权衡的论文与研究博客（例："我们如何把 X 落到 prod"、"RAG 系统在 1B 文档量下的工程教训"、"LLM 推理优化的实测对比与取舍"）
- REJECT：纯 SOTA 报告、benchmark 横评、单一算法证明、纯理论推导、新模型架构论文（除非文中有明确的"工程师能直接拿走的东西"，例如可复现的训练 trick、量化/部署经验、可落地的评估方法）
- 判断不准时倾向 REJECT —— 论文进入门槛高于工程文章
- **注意**：上述论文 REJECT 规则**仅适用于研究 / 学术导向的内容**。普通工程博文不属此列，按通用标准评判。

**明确拒绝的内容：**
- 版本发布公告、changelog、release notes（除非包含深度技术解读）
- 简单新闻转载、资讯汇总（除非有独立技术分析）
- 纯入门教程、step-by-step 指南（除非涉及高级主题或独特视角）
- 产品营销、招聘信息、广告
- 纯链接聚合、简短摘要、社区讨论帖
- 内容过短或信息密度低的文章

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
