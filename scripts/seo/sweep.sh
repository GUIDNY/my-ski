#!/bin/bash
# Fetch the live sitemap and check every URL's status as Googlebot (8 at a time).
# usage: bash scripts/seo/sweep.sh [out-file]
OUT=${1:-/tmp/seo_sweep.txt}
UA="Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
curl -s -A "$UA" https://skisharebook.com/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's/<loc>//;s/<\/loc>//' | sort -u > "$OUT.urls"
xargs -P 8 -I{} sh -c 'printf "%s %s\n" "$(curl -s -o /dev/null -w "%{http_code}" -A "$1" "$2")" "$2"' _ "$UA" {} < "$OUT.urls" > "$OUT"
echo "urls: $(wc -l < "$OUT.urls")  200: $(grep -c '^200 ' "$OUT")  other: $(grep -vc '^200 ' "$OUT")"
grep -v '^200 ' "$OUT" | head -20
