
/**
 * Smart Merger Logic (TypeScript Port of ai_smart_merge.py)
 */

export interface MergedPage {
    filename: string;
    title: string;
    content: string; // The full HTML content
    safeContent: string; // JSON-escaped + script-tag escaped content
}

export function extractTitle(html: string, filename: string): string {
    // Try nn-header-title div
    const headerMatch = html.match(/<div[^>]*class=["'][^"']*nn-header-title[^"']*["'][^>]*>(.*?)<\/div>/is);
    if (headerMatch && headerMatch[1]) {
        return headerMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Try <title> tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
        let t = titleMatch[1].trim();
        t = t.replace(/^NINETYNINE\s*-\s*/i, '');
        return t;
    }

    // Fallback to filename
    const name = filename.substring(0, filename.lastIndexOf('.')) || filename;
    return name.replace(/_/g, ' ');
}

export function smartMergeFiles(files: File[]): Promise<MergedPage[]> {
    return Promise.all(
        files.map(async (file) => {
            const text = await file.text();
            const title = extractTitle(text, file.name);

            // JSON.stringify to safely escape everything for JS variable
            const safeString = JSON.stringify(text);

            // CRITICAL: Escape </script> to avoid breaking the parent script block
            // In JS, merged content is often inserted via document.write or stored in variable.
            // If the content contains </script>, the browser parser will close the parent script.
            const superSafeString = safeString.replace(/<\/script>/g, '<\\/script>');

            return {
                filename: file.name,
                title,
                content: text,
                safeContent: superSafeString
            };
        })
    );
}

export function generateMergedHtml(pages: MergedPage[]): string {
    const jsonPages = pages.map(p => p.safeContent).join(',\n            ');
    const navButtons = pages.map((p, idx) => {
        const activeClass = idx === 0 ? ' active' : '';
        const safeTitle = p.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `            <button class="nav-btn page-num${activeClass}" onclick="goPage(${idx})" title="${safeTitle}">${idx + 1}</button>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lecture Forge - Merged Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #0F172A; font-family: 'Inter', 'Noto Sans KR', sans-serif; }
        .page-frame { width: 100%; height: 100%; border: none; display: block; background: #FFFFFF; }
        .nn-spa-nav { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; display: flex; align-items: center; gap: 4px; background: rgba(10, 30, 96, 0.94); backdrop-filter: blur(14px); padding: 7px 12px; border-radius: 12px; border: 1px solid rgba(0, 191, 165, 0.3); box-shadow: 0 6px 30px rgba(0,0,0,0.5); transition: all 0.3s ease; }
        .nav-toggle-btn { background: transparent; border: none; color: #00BFA5; font-size: 17px; cursor: pointer; padding: 4px 7px; border-radius: 5px; transition: all 0.2s ease; line-height: 1; }
        .nav-toggle-btn:hover { background: rgba(0, 191, 165, 0.18); transform: scale(1.1); }
        .nav-buttons-wrap { display: flex; gap: 3px; overflow: hidden; max-width: 800px; transition: max-width 0.4s ease, opacity 0.3s ease; opacity: 1; padding-left: 6px; }
        .nav-buttons-wrap.collapsed { max-width: 0; opacity: 0; padding-left: 0; }
        .nav-btn { background: transparent; border: 1px solid transparent; color: rgba(255,255,255,0.5); font-family: monospace; font-size: 12px; font-weight: 600; cursor: pointer; padding: 5px 9px; border-radius: 6px; transition: all 0.2s ease; min-width: 28px; text-align: center; white-space: nowrap; }
        .nav-btn:hover { color: #FFFFFF; background: rgba(0, 191, 165, 0.12); }
        .nav-btn.active { color: #00BFA5; background: rgba(0, 191, 165, 0.18); border-color: rgba(0, 191, 165, 0.35); font-weight: 700; box-shadow: 0 0 10px rgba(0, 191, 165, 0.2); }
        .page-indicator { color: rgba(255,255,255,0.4); font-size: 10px; padding: 0 6px; font-weight: 500; white-space: nowrap; }
    </style>
</head>
<body>
    <nav class="nn-spa-nav" id="navPanel">
        <button class="nav-toggle-btn" onclick="toggleNav()">☰</button>
        <div class="nav-buttons-wrap" id="navBtns">
            <button class="nav-btn" onclick="prevPage()">&lt;&lt;</button>
${navButtons}
            <button class="nav-btn" onclick="nextPage()">&gt;&gt;</button>
            <span class="page-indicator" id="pageIndicator">1/${pages.length}</span>
        </div>
    </nav>
    <iframe id="pageFrame" class="page-frame" frameborder="0"></iframe>
    <script>
        var _pages = [
            ${jsonPages}
        ];
        var _totalPages = ${pages.length};
        var _currentPage = 0;
        var _navCollapsed = false;

        function loadPage(idx) {
            var frame = document.getElementById('pageFrame');
            // Use Blob URL instead of document.write() to ensure external scripts
            // (Chart.js CDN etc.) are fully loaded before DOMContentLoaded fires.
            // document.write() + doc.close() fires DOMContentLoaded immediately,
            // before CDN scripts finish downloading, causing charts to disappear.
            var blob = new Blob([_pages[idx]], { type: 'text/html;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            if (frame._blobUrl) URL.revokeObjectURL(frame._blobUrl);
            frame._blobUrl = url;
            frame.src = url;
        }
        function goPage(idx) {
            if (idx < 0 || idx >= _totalPages) return;
            _currentPage = idx;
            updateNav();
            loadPage(idx);
        }
        function prevPage() { goPage(_currentPage - 1); }
        function nextPage() { goPage(_currentPage + 1); }
        function toggleNav() {
            _navCollapsed = !_navCollapsed;
            var wrap = document.getElementById('navBtns');
            if (_navCollapsed) wrap.classList.add('collapsed');
            else wrap.classList.remove('collapsed');
        }
        function updateNav() {
            var btns = document.querySelectorAll('.nav-btn.page-num');
            for (var i = 0; i < btns.length; i++) {
                if (i === _currentPage) btns[i].classList.add('active');
                else btns[i].classList.remove('active');
            }
            document.getElementById('pageIndicator').textContent = (_currentPage + 1) + '/' + _totalPages;
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        });
        window.addEventListener('load', function() { setTimeout(() => loadPage(0), 100); });
    </script>
</body>
</html>`;
}
