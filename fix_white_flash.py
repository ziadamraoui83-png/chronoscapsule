#!/usr/bin/env python3
"""
Fix white flash v2 — the correct way
- Remove inline html style
- Remove cc_html_fade script
"""

import os
import re

REPO_DIR = "."
IGNORED_DIRS = {'.git', 'node_modules', '.vercel', 'dist', 'build', '.next', '.vscode'}

stats = {"processed": 0, "modified": 0, "skipped": 0}

def process_html(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        stats["processed"] += 1
        original = content
        
        # ═══ 1. حذف inline style من <html> ═══
        content = re.sub(
            r'<html\s+lang="(ar|en)"\s+dir="(rtl|ltr)"\s+style="background:#010103">',
            r'<html lang="\1" dir="\2">',
            content
        )
        
        # ═══ 2. حذف script cc_html_fade ═══
        content = re.sub(
            r'\s*<script id="cc_html_fade">.*?</script>\s*',
            '\n',
            content,
            flags=re.DOTALL
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {filepath}")
            stats["modified"] += 1
        else:
            print(f"⏭️  Skipped: {filepath}")
            stats["skipped"] += 1
    
    except Exception as e:
        print(f"❌ {filepath}: {e}")

def main():
    print("═" * 60)
    print("🚀 Fix White Flash v2")
    print("═" * 60)
    
    files = []
    for root, dirs, fs in os.walk(REPO_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for f in fs:
            if f.endswith('.html'):
                files.append(os.path.join(root, f))
    
    files.sort()
    print(f"\n📁 Found {len(files)} files\n")
    
    for f in files:
        process_html(f)
    
    print("\n" + "═" * 60)
    print(f"✅ Modified: {stats['modified']}")
    print(f"⏭️  Skipped:  {stats['skipped']}")
    print("═" * 60)

if __name__ == "__main__":
    main()