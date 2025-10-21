"""Verify that header navigation links resolve to actual files.

This script parses the header of key HTML pages and ensures that each
relative link maps to an existing file path. External links are skipped.
"""
from pathlib import Path
import re

PAGES = [
    Path('index.html'),
    Path('pages/solutions.html'),
    Path('pages/technology.html'),
    Path('pages/use-cases.html'),
    Path('pages/about.html'),
    Path('pages/contact.html'),
    Path('pages/capabilities.html'),
    Path('pages/login.html'),
    Path('pages/demo.html'),
]

HEADER_LINK_PATTERN = re.compile(r'href="([^"]+)"')
IMG_PATTERN = re.compile(r'<img\b([^>]*)>', re.IGNORECASE)


def collect_header_links(page: Path) -> list[str]:
    """Extract href targets from a page header."""
    text = page.read_text()
    start = text.find('<header')
    end = text.find('</header>', start)
    if start == -1 or end == -1:
        return []
    header_html = text[start:end]
    return [match.group(1) for match in HEADER_LINK_PATTERN.finditer(header_html)]


def main() -> None:
    missing: list[tuple[Path, str]] = []
    missing_csrf: list[Path] = []
    missing_doctype: list[Path] = []
    lazy_stats: list[tuple[Path, int, int]] = []
    missing_viewport: list[Path] = []
    for page in PAGES:
        for href in collect_header_links(page):
            if href.startswith(('http', 'mailto:', 'tel:', '#')):
                continue
            target = (page.parent / href).resolve()
            if not target.exists():
                missing.append((page, href))

        text = page.read_text()
        if 'meta name="csrf-token"' not in text:
            missing_csrf.append(page)
        stripped = text.lstrip().lower()
        if not stripped.startswith('<!doctype html>'):
            missing_doctype.append(page)
        if 'meta name="viewport"' not in text.lower():
            missing_viewport.append(page)

        images = IMG_PATTERN.findall(text)
        if images:
            lazy = sum(1 for attrs in images if 'loading="lazy"' in attrs.lower())
            lazy_stats.append((page, lazy, len(images)))

    if missing:
        print('Missing header targets:')
        for page, href in missing:
            print(f"{page}: {href}")
        raise SystemExit(1)

    if missing_csrf:
        print('Security: pages missing csrf-token meta tag:')
        for page in missing_csrf:
            print(f" - {page}")
        raise SystemExit(1)

    if missing_doctype or missing_viewport:
        print('Cross-browser readiness checks failed:')
        for page in missing_doctype:
            print(f" - {page} missing <!DOCTYPE html>")
        for page in missing_viewport:
            print(f" - {page} missing viewport meta tag")
        raise SystemExit(1)

    if lazy_stats:
        print('Performance metrics (lazy-loaded images):')
        for page, lazy, total in lazy_stats:
            ratio = (lazy / total) * 100 if total else 0
            print(f" - {page}: {lazy}/{total} images lazy ({ratio:.0f}% coverage)")

    print('All header links resolve to existing files.')


if __name__ == '__main__':
    main()
