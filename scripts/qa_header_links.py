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
]

HEADER_LINK_PATTERN = re.compile(r'href="([^"]+)"')


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
    for page in PAGES:
        for href in collect_header_links(page):
            if href.startswith(('http', 'mailto:', 'tel:', '#')):
                continue
            target = (page.parent / href).resolve()
            if not target.exists():
                missing.append((page, href))

    if missing:
        print('Missing header targets:')
        for page, href in missing:
            print(f"{page}: {href}")
        raise SystemExit(1)

    print('All header links resolve to existing files.')


if __name__ == '__main__':
    main()
