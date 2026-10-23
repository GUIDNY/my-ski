"""Submit every URL in the live sitemap (or the given URLs) to IndexNow (Bing, Yandex, ...).
Bing feeds ChatGPT search, so this matters for AI answers too.
python3 -I scripts/seo/indexnow.py [url ...]"""
import json, re, sys, urllib.request
KEY = "5e55b38419baf50c3c00e414a2940d79"  # public by design: served at /<KEY>.txt
HOST = "skisharebook.com"
urls = sys.argv[1:]
if not urls:
    sm = urllib.request.urlopen(f"https://{HOST}/sitemap.xml", timeout=60).read().decode()
    urls = re.findall(r"<loc>(.*?)</loc>", sm)
body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"https://{HOST}/{KEY}.txt", "urlList": urls}).encode()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
try:
    r = urllib.request.urlopen(req, timeout=60)
    print("IndexNow", r.status, len(urls), "urls")
except urllib.error.HTTPError as e:
    print("IndexNow error", e.code, e.read()[:300])
