"""LLM processing module for article summarization and categorization."""

import json
import os
import re

import requests
import yaml

# Configuration path
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "rss_config.yaml")


def load_classification_config():
    """Load classification rules from config."""
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("classification", {})


def _get_llm_headers(api_key):
    """Get headers for LLM API requests."""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }


def _build_article_filter_prompt(title, content):
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


def filter_article_content(title, content, llm_config=None):
    """
    Filter article content using LLM to determine if it should be included.
    
    Args:
        title (str): Article title
        content (str): Article content
        llm_config (dict): LLM configuration
    
    Returns:
        tuple: (should_include: bool, reason: str)
    """
    if not llm_config or not llm_config.get("api_key"):
        print("⚠ No LLM config provided, accepting all articles")
        return True, "No LLM filtering configured"
    
    print(f"🔍 Filtering article: {title}")
    
    try:
        headers = _get_llm_headers(llm_config["api_key"])
        prompt = _build_article_filter_prompt(title, content)
        
        payload = {
            "model": "qwen-plus",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 200,
        }
        
        response = requests.post(
            llm_config["api_endpoint"], 
            headers=headers, 
            json=payload, 
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            llm_response = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse response
            if "ACCEPT" in llm_response.upper():
                reason = llm_response.split(":", 1)[1].strip() if ":" in llm_response else "Meets technical content criteria"
                print(f"✅ Article accepted: {reason}")
                return True, reason
            else:
                reason = llm_response.split(":", 1)[1].strip() if ":" in llm_response else "Does not meet criteria"
                print(f"❌ Article rejected: {reason}")
                return False, reason
        else:
            print(f"⚠ LLM API error: {response.status_code}")
            return True, "LLM API error, accepting by default"
    
    except Exception as e:
        print(f"⚠ Error in content filtering: {e}")
        return True, "Error in filtering, accepting by default"


def _build_classification_prompt(title, content):
    """Build prompt for article classification."""
    classification_config = load_classification_config()
    categories = classification_config.get("categories", [])
    prompt_template = classification_config.get("prompt_template", "")

    categories_list = "\n".join([f"- {cat['name']}: {cat['description']}" for cat in categories])

    return (
        prompt_template.format(
            categories_list=categories_list,
            title=title,
            content=content[:1000],  # Limit content length for classification
        ),
        categories,
    )


def _build_summary_tags_prompt(title, content):
    """Build prompt for article summary and tags generation."""
    return f"""请完成以下两个任务：

1. 将技术文章总结为3-5个要点，保持简洁清晰
2. 为文章生成2-3个相关的标签（短词或短语，如"机器学习"、"性能优化"、"架构设计"等）

文章标题: {title}
文章内容: {content}

请按以下JSON格式返回：
{{"summary": "你的总结内容", "tags": ["标签1", "标签2", "标签3"]}}"""


def _get_category_from_llm(classification_prompt, categories, headers, api_endpoint):
    """Get article category from LLM."""
    classification_payload = {
        "model": "qwen-plus",
        "messages": [{"role": "user", "content": classification_prompt}],
        "max_tokens": 50,
    }

    response = requests.post(api_endpoint, headers=headers, json=classification_payload, timeout=60)
    response.raise_for_status()
    category = response.json().get("choices", [{}])[0].get("message", {}).get("content", "Other").strip()

    # Validate category exists in our list
    valid_categories = [cat["name"] for cat in categories]
    if category not in valid_categories:
        category = "Other"

    return category


def _get_summary_and_tags_from_llm(summary_tags_prompt, headers, content, api_endpoint):
    """Get article summary and tags from LLM."""
    summary_tags_payload = {
        "model": "qwen-plus",
        "messages": [{"role": "user", "content": summary_tags_prompt}],
        "max_tokens": 400,
    }

    response = requests.post(api_endpoint, headers=headers, json=summary_tags_payload, timeout=60)
    response.raise_for_status()
    llm_output = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()

    # Try to parse JSON response
    try:
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r"```json\n(.*?)\n```", llm_output, re.DOTALL)
        if json_match:
            json_string = json_match.group(1)
        else:
            json_string = llm_output

        parsed_output = json.loads(json_string)
        summary = parsed_output.get("summary", f"Summary: {content[:200]}...")
        tags = parsed_output.get("tags", [])

        # Ensure tags is a list and limit to 3
        if isinstance(tags, list):
            tags = tags[:3]
        else:
            tags = []

    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing JSON from LLM response: {e}")
        print(f"Raw output: {llm_output}")
        # Fallback: extract summary manually and leave tags empty
        summary = llm_output if llm_output else f"Summary: {content[:200]}..."
        tags = []

    return summary, tags


def _create_fallback_summary(title, content):
    """Create a simple fallback summary when LLM is not available."""
    # Use first few sentences or first 300 characters
    sentences = content.split(". ")
    if len(sentences) > 1:
        summary = ". ".join(sentences[:3]) + "."
        if len(summary) > 300:
            summary = content[:300] + "..."
    else:
        summary = content[:300] + "..."

    return summary


def _guess_category_from_content(title, content):
    """Simple keyword-based category guessing."""
    text = (title + " " + content).lower()

    # Simple keyword matching
    if any(word in text for word in ["tech", "programming", "software", "ai", "algorithm", "computer"]):
        return "Technology"
    elif any(word in text for word in ["math", "mathematics", "optimal", "equation", "calculation"]):
        return "Science"
    elif any(word in text for word in ["cook", "recipe", "food", "chef", "kitchen", "onion"]):
        return "Lifestyle"
    else:
        return "Other"


def summarize_and_categorize_article(title, content, llm_config=None):
    """Summarizes an article and suggests a category and tags using LLM API."""
    if not llm_config or not llm_config.get("api_endpoint") or not llm_config.get("api_key"):
        print("LLM configuration not provided or incomplete. Using fallback processing.")
        summary = _create_fallback_summary(title, content)
        category = _guess_category_from_content(title, content)
        return summary, category, []

    api_endpoint = llm_config["api_endpoint"]
    api_key = llm_config["api_key"]

    print(f"Processing article for summary, category, and tags: {title}")

    try:
        headers = _get_llm_headers(api_key)
        classification_prompt, categories = _build_classification_prompt(title, content)
        summary_tags_prompt = _build_summary_tags_prompt(title, content)

        # Get category from LLM
        category = _get_category_from_llm(classification_prompt, categories, headers, api_endpoint)

        # Get summary and tags from LLM
        summary, tags = _get_summary_and_tags_from_llm(summary_tags_prompt, headers, content, api_endpoint)

        print(f"Classification result: {category}")
        print(f"Generated tags: {tags}")

        return summary, category, tags

    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM API: {e}")
        print(f"API Endpoint: {api_endpoint}")
        print("Falling back to simple text processing...")

        # Fallback to simple processing
        summary = _create_fallback_summary(title, content)
        category = _guess_category_from_content(title, content)
        return summary, category, []
