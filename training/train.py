"""
scrape_site.py
Crawl a domain (and its subdomain for blogs) and extract structured page content
Outputs: scraped_pages.json
"""
import json
import os
import re
import time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# Optional: Playwright for JS-rendered pages
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except Exception:
    PLAYWRIGHT_AVAILABLE = False

# Config
ROOTS = ["https://www.iabdulghaffar.com", "https://iabdulghaffar.com", "https://blogs.iabdulghaffar.com"]
MAX_PAGES = 2000
DELAY = 0.25    # polite delay between requests
OUTPUT = "scraped_pages.json"
HEADERS = {"User-Agent": "SiteScraper/1.0 (+https://github.com/your-repo)"}  # change if you like

# Helpers
def same_host(a, b):
    return urlparse(a).netloc == urlparse(b).netloc

def normalize_url(base, link):
    if not link:
        return None
    parsed = urlparse(link)
    if parsed.scheme and parsed.netloc:
        return link.split('#')[0].rstrip('/')
    try:
        joined = urljoin(base, link)
        return joined.split('#')[0].rstrip('/')
    except:
        return None

def fetch_robots(root):
    try:
        r = requests.get(urljoin(root, "/robots.txt"), headers=HEADERS, timeout=10)
        if r.status_code == 200:
            return r.text
    except:
        pass
    return ""

def allowed_by_robots(robots_txt, url):
    # crude: if 'Disallow: /' present for User-agent: * we'll block everything.
    if not robots_txt:
        return True
    # Very simple check: if Disallow: / is present under User-agent: *
    # For full spec parsing use 'reppy' or 'robotexclusionrulesparser' — but avoid extra deps here.
    lines = [l.strip() for l in robots_txt.splitlines() if l.strip()]
    ua_star = False
    disallows = []
    for ln in lines:
        if ln.lower().startswith("user-agent:"):
            ua = ln.split(":",1)[1].strip()
            ua_star = (ua == "*" )
        elif ua_star and ln.lower().startswith("disallow:"):
            path = ln.split(":",1)[1].strip()
            disallows.append(path)
    # If disallow contains '/', block
    if "/" in disallows:
        return False
    return True

def fetch_html_requests(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        # print("requests error", e)
        return None
    return None

def fetch_with_playwright(url, timeout=15000):
    if not PLAYWRIGHT_AVAILABLE:
        return None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=timeout)
            page.wait_for_load_state("networkidle", timeout=timeout)
            html = page.content()
            browser.close()
            return html
    except Exception:
        return None

def extract_page_fields(url, html):
    soup = BeautifulSoup(html, "lxml")
    title = (soup.title.string.strip() if soup.title and soup.title.string else "") 
    meta_desc = ""
    d = soup.find("meta", attrs={"name":"description"}) or soup.find("meta", attrs={"property":"og:description"})
    if d and d.get("content"):
        meta_desc = d["content"].strip()
    h1 = ""
    h1_tag = soup.find("h1")
    if h1_tag:
        h1 = h1_tag.get_text(" ", strip=True)
    # Collect headings
    headings = []
    for h in soup.find_all(re.compile("^h[1-6]$")):
        headings.append({"tag": h.name, "text": h.get_text(" ", strip=True)})
    # Main text heuristic: join paragraphs and long text blocks
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    main_text = "\n\n".join([p for p in paragraphs if len(p) > 30])
    # additionally pull article tags/dates if present
    date = ""
    # common date selectors
    date_selectors = ['time', '.date', '.posted-on', '.post-meta', '[itemprop="datePublished"]']
    for sel in date_selectors:
        el = soup.select_one(sel)
        if el:
            date = el.get_text(" ", strip=True)
            break
    # collect links
    links = []
    for a in soup.find_all("a", href=True):
        href = a['href']
        links.append({"href": href, "text": a.get_text(" ", strip=True)})
    return {
        "url": url,
        "title": title,
        "meta_description": meta_desc,
        "h1": h1,
        "headings": headings,
        "date": date,
        "text": main_text,
        "links": links
    }

def try_fetch(url, robots_txt):
    if not allowed_by_robots(robots_txt, url):
        return None
    html = fetch_html_requests(url)
    if html and ("<script" in html and "next" in html.lower()):
        # If page uses Next.js or heavy JS, use playwright fallback
        pw_html = fetch_with_playwright(url)
        if pw_html:
            html = pw_html
    # if html is none, try playwright anyway
    if not html and PLAYWRIGHT_AVAILABLE:
        html = fetch_with_playwright(url)
    return html

def crawl(roots):
    visited = set()
    queue = []
    for r in roots:
        queue.append(r.rstrip('/'))
    scraped = []
    robots_cache = {}
    pbar = tqdm(total=MAX_PAGES, desc="Crawling", unit="page")
    while queue and len(visited) < MAX_PAGES:
        url = queue.pop(0)
        if url in visited:
            continue
        parsed = urlparse(url)
        root = f"{parsed.scheme}://{parsed.netloc}"
        if root not in robots_cache:
            robots_cache[root] = fetch_robots(root)
        robots_txt = robots_cache[root]
        # normalize
        try:
            time.sleep(DELAY)
            html = try_fetch(url, robots_txt)
            if not html:
                visited.add(url)
                pbar.update(1)
                continue
            data = extract_page_fields(url, html)
            scraped.append(data)
            visited.add(url)
            pbar.update(1)
            # discover internal links
            for a in data["links"]:
                n = normalize_url(url, a["href"])
                if not n:
                    continue
                # only crawl pages in same domain or specified roots (cover subdomain blogs)
                if any(urlparse(n).netloc.endswith(root_n.split("://")[-1]) or urlparse(n).netloc==urlparse(r).netloc for r in roots for root_n in roots):
                    if n not in visited and n not in queue:
                        queue.append(n)
        except Exception as e:
            # skip on error
            visited.add(url)
            pbar.update(1)
            continue
    pbar.close()
    return scraped

if __name__ == "__main__":
    print("Starting crawl for roots:", ROOTS)
    pages = crawl(ROOTS)
    # Save
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump({"generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "pages": pages}, f, indent=2, ensure_ascii=False)
    print("Saved", len(pages), "pages to", OUTPUT)
