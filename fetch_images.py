#!/usr/bin/env python3
"""
Fetch real product images from Instagram posts using og:image metadata.
"""
import urllib.request
import urllib.error
import re
import os
import time

ASSETS_DIR = "/Users/maniksahni/Desktop/ecommerce/assets/instagram-shop"

# All 24 shop products: (post_id, filename)
PRODUCTS = [
    ("DXtZLoWkVZo", "post-021-DXtZLoWkVZo.jpg"),
    ("DXbGtV-kd5A", "post-029-DXbGtV-kd5A.jpg"),
    ("DXRflQ2ARK2", "post-036-DXRflQ2ARK2.jpg"),
    ("DXOonNskfbi", "post-039-DXOonNskfbi.jpg"),
    ("DXLqgBTkXIL", "post-041-DXLqgBTkXIL.jpg"),
    ("DW9Cf8OkWo0", "post-049-DW9Cf8OkWo0.jpg"),
    ("DW3H_GZDD_4", "post-051-DW3H_GZDD_4.jpg"),
    ("DWyr2aXjKHn", "post-055-DWyr2aXjKHn.jpg"),
    ("DWtcQ8OAefp", "post-060-DWtcQ8OAefp.jpg"),
    ("DWss1yNkbcd", "post-062-DWss1yNkbcd.jpg"),
    ("DWlGxA6DBMP", "post-067-DWlGxA6DBMP.jpg"),
    ("DWf-enREft_", "post-070-DWf-enREft_.jpg"),
    ("DWambX9EROs", "post-073-DWambX9EROs.jpg"),
    ("DWQku-DkVc3", "post-079-DWQku-DkVc3.jpg"),
    ("DV3atErkWR3", "post-085-DV3atErkWR3.jpg"),
    ("DVyEUMmEZcr", "post-087-DVyEUMmEZcr.jpg"),
    ("DVsiM2WEctG", "post-090-DVsiM2WEctG.jpg"),
    ("DVkvt0ckc1I", "post-092-DVkvt0ckc1I.jpg"),
    ("DVa5mXPkdo7", "post-093-DVa5mXPkdo7.jpg"),
    ("DVTTCEZkTWG", "post-095-DVTTCEZkTWG.jpg"),
    ("DVOWZJVAc5X", "post-097-DVOWZJVAc5X.jpg"),
    ("DVGLWtPEbN4", "post-098-DVGLWtPEbN4.jpg"),
    ("DUxvyF_kXUT", "post-102-DUxvyF_kXUT.jpg"),
    ("DUsq31AgXWw", "post-103-DUsq31AgXWw.jpg"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

def get_og_image(post_id):
    url = f"https://www.instagram.com/p/{post_id}/"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        # Try og:image first
        match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
        if not match:
            match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
        if match:
            return match.group(1)
        # Try JSON data
        match = re.search(r'"display_url":"([^"]+)"', html)
        if match:
            return match.group(1).replace("\\u0026", "&")
    except Exception as e:
        print(f"  ERROR fetching page: {e}")
    return None

def download_image(img_url, dest_path):
    req = urllib.request.Request(img_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        with open(dest_path, "wb") as f:
            f.write(data)
        size_kb = len(data) // 1024
        print(f"  ✅ Saved {size_kb}KB → {os.path.basename(dest_path)}")
        return True
    except Exception as e:
        print(f"  ERROR downloading image: {e}")
        return False

results = []
for i, (post_id, filename) in enumerate(PRODUCTS, 1):
    print(f"\n[{i}/{len(PRODUCTS)}] Post: {post_id}")
    dest = os.path.join(ASSETS_DIR, filename)
    
    img_url = get_og_image(post_id)
    if img_url:
        print(f"  Found image URL: {img_url[:80]}...")
        ok = download_image(img_url, dest)
        results.append((post_id, filename, "OK" if ok else "DOWNLOAD_FAIL"))
    else:
        print(f"  ❌ Could not find image URL")
        results.append((post_id, filename, "NO_URL"))
    
    time.sleep(1.5)  # Be polite

print("\n\n=== SUMMARY ===")
for post_id, filename, status in results:
    print(f"{status:15} {post_id}  {filename}")
ok_count = sum(1 for _, _, s in results if s == "OK")
print(f"\n{ok_count}/{len(PRODUCTS)} images downloaded successfully")
