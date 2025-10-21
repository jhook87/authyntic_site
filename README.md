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
- `js/` — client-side authentication, main site logic, UX enhancements, and the operator demo runtime.
  - `auth.js` — Authentication and session management
  - `main.js` — Core site functionality
  - `ux-enhancements.js` — Accessibility and UX improvements (NEW)
  - `demo.js` — Operator dashboard demo
- `css/style.css` — comprehensive styling system with security-first design, theming, grid utilities, and animation primitives.
- `docs/` — Design system and accessibility documentation (NEW)
  - `DESIGN_SYSTEM.md` — Complete design system reference
  - `ACCESSIBILITY.md` — WCAG AAA testing methodology  
  - `UX_IMPROVEMENTS.md` — Before/after improvement summary
- `server.py` — lightweight backend providing secure session and API scaffolding.
- `scripts/` — QA tooling.

## UX/UI Enhancements

The site features a comprehensive security-first design system:

- **Security States**: 5 distinct visual states (critical, warning, success, info, neutral)
- **Accessibility**: WCAG AAA compliant with enhanced keyboard navigation, screen reader support, and 44x44px touch targets
- **Form Experience**: Real-time validation with password strength indicators
- **Loading States**: Skeletons, spinners, and progress bars with animations
- **Offline Support**: Visual indicators for connectivity status
- **Trust Indicators**: Animated indicators showing security trust levels
- **Performance**: Hardware-accelerated animations with lazy loading

See `/docs/DESIGN_SYSTEM.md` for complete documentation.

## Browser Demo

The operator demo is available at `/pages/demo.html`. Authenticate with the header login control to explore live metrics, health grids, and scenario-driven simulations tailored for defense operations.
