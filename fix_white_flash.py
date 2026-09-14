#!/usr/bin/env python3
"""
Fix white flash v3 — inline critical CSS
- Adds inline <style> in <head> right after <meta charset>
- Prevents white flash even before external CSS loads
"""

import os
import re

REPO_DIR = "."
IGNORED_DIRS = {'.git', 'node_modules', '.vercel', 'dist', 'build', '.next', '.vscode'}

INLINE_STYLE = '''<meta charset="UTF-8">
    <!-- ═══ منع الوميض الأبيض — inline (critical CSS) ═══ -->
    <style id="cc_critical">
        html { background: #010103 !important; }
        body { background: #010103; opacity: 0; transition: opacity 0.35s ease; }
        body.cc-loaded { opacity: 1; }
    </style>'''

stats = {"processed": 0, "modified": 0, "skipped": 0}

def process_html(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        stats["processed"] += 1
        original = content
        
        # ═══ Skip إذا كان موجود من قبل ═══
        if 'cc_critical' in content:
            print(f"⏭️  Already fixed: {filepath}")
            stats["skipped"] += 1
            return
        
        # ═══ بدّل <meta charset="UTF-8"> بالنسخة المطولة ═══
        if '<meta charset="UTF-8">' in content:
            content = content.replace(
                '<meta charset="UTF-8">',
                INLINE_STYLE,
                1
            )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {filepath}")
            stats["modified"] += 1
        else:
            print(f"⚠️  No charset tag: {filepath}")
            stats["skipped"] += 1
    
    except Exception as e:
        print(f"❌ {filepath}: {e}")

def main():
    print("═" * 60)
    print("🚀 Fix White Flash v3 — Inline Critical CSS")
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