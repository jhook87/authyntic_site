# Authyntic Site

This repository hosts the Authyntic public marketing site, the operator demo experience, and supporting automation utilities.

## Getting Started

1. Install dependencies using npm (or pnpm):
   ```bash
   npm install
   ```
2. Launch the development server:
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:3000/.

## Testing

Run the automated QA link validation script to confirm marketing pages remain healthy:
```bash
python3 scripts/qa_header_links.py
```

## Project Structure

- `index.html` and `pages/` — public-facing marketing content.
- `js/` — client-side authentication, main site logic, and the operator demo runtime.
- `css/style.css` — global styling system with theming, grid utilities, and animation primitives.
- `server.py` — lightweight backend providing secure session and API scaffolding.
- `scripts/` — QA tooling.

## Browser Demo

The operator demo is available at `/pages/demo.html`. Authenticate with the header login control to explore live metrics, health grids, and scenario-driven simulations tailored for defense operations.
