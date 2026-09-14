#!/usr/bin/env python3
"""
Chronos Capsule — Fix White Flash
- Adds inline background to <html> tag
- Moves opacity:0 to inline <head> script
"""

import os
import re

REPO_DIR = "."
IGNORED_DIRS = {'.git', 'node_modules', '.vercel', 'dist', 'build', '.next', '.vscode'}

stats = {"processed": 0, "modified": 0, "skipped": 0, "errors": 0}

def process_html(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        stats["processed"] += 1
        original = content
        
        # ═══ 1. زيد background للـ html ═══
        # Case 1: <html lang="ar" dir="rtl">
        content = re.sub(
            r'<html\s+lang="ar"\s+dir="rtl">',
            '<html lang="ar" dir="rtl" style="background:#010103">',
            content
        )
        # Case 2: <html lang="en" dir="ltr">
        content = re.sub(
            r'<html\s+lang="en"\s+dir="ltr">',
            '<html lang="en" dir="ltr" style="background:#010103">',
            content
        )
        # Case 3: already has style
        content = re.sub(
            r'<html\s+lang="(ar|en)"\s+dir="(rtl|ltr)"\s+style="[^"]*">',
            r'<html lang="\1" dir="\2" style="background:#010103">',
            content
        )
        
        # ═══ 2. زيد inline script في <head> ═══
        if 'cc_html_fade' not in content:
            fade_script = '''<head>
    <script id="cc_html_fade">
    /* Prevent white flash on page navigation */
    (function(){
        try {
            document.documentElement.style.opacity = '0';
            document.documentElement.style.transition = 'opacity 0.35s ease';
        } catch(e){}
    })();
    </script>'''
            
            content = re.sub(r'<head>', fade_script, content, count=1)
        
        # ═══ حفظ إذا تغير ═══
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Modified: {filepath}")
            stats["modified"] += 1
        else:
            print(f"⏭️  No change: {filepath}")
            stats["skipped"] += 1
    
    except Exception as e:
        print(f"❌ Error {filepath}: {e}")
        stats["errors"] += 1

def main():
    print("═" * 60)
    print("🚀 Fix White Flash — Chronos Capsule")
    print("═" * 60)
    
    html_files = []
    for root, dirs, files in os.walk(REPO_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    html_files.sort()
    print(f"\n📁 Found {len(html_files)} HTML files\n")
    
    for f in html_files:
        process_html(f)
    
    print("\n" + "═" * 60)
    print("📊 Summary:")
    print(f"   📄 Processed: {stats['processed']}")
    print(f"   ✅ Modified:  {stats['modified']}")
    print(f"   ⏭️  Skipped:   {stats['skipped']}")
    print(f"   ❌ Errors:    {stats['errors']}")
    print("═" * 60)

if __name__ == "__main__":
    main()