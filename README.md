# Authyntic Site

This repository hosts the Authyntic public marketing site, the operator demo experience, and supporting automation utilities.

## Getting Started

### Development with Vite

The site now uses **Vite** for modern development and optimized production builds.

1. Install dependencies using npm (or pnpm):
   ```bash
   npm install
   ```

2. Launch the development server:
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:3000/ with hot module reloading.

3. Build for production:
   ```bash
   npm run build
   ```
   Production-optimized files will be output to the `dist/` directory.

4. Preview production build:
   ```bash
   npm run preview
   ```

### Python Backend Server

For authentication features, run the Python backend alongside Vite:
```bash
npm run serve
```

The backend provides secure session management and API scaffolding. Vite is configured to proxy API requests to the backend server.

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
  - `ux-enhancements.js` — Accessibility and UX improvements
  - `demo.js` — Operator dashboard demo
- `css/style.css` — comprehensive styling system with security-first design, theming, grid utilities, and animation primitives.
- `docs/` — Design system and accessibility documentation
  - `DESIGN_SYSTEM.md` — Complete design system reference
  - `ACCESSIBILITY.md` — WCAG AAA testing methodology  
  - `UX_IMPROVEMENTS.md` — Before/after improvement summary
- `server.py` — lightweight backend providing secure session and API scaffolding.
- `scripts/` — QA tooling.
- `vite.config.js` — Vite build configuration with multi-page support and optimization.

## Design System Enhancements

The site features a world-class, security-first design system:

### Grid System
- **12-column responsive grid** with breakpoints at 375px, 768px, 1024px, and 1440px
- Container max-width: 1240px
- Consistent 8px-based spacing scale
- Responsive grid utilities for all breakpoints

### Typography
- **Rajdhani** for technical precision in headings
- **Inter** for optimal readability in body text
- Dynamic type scale from 12px to 36px
- Vertical rhythm system with 1.5 line height

### Color System
- **Primary Accent:** #FF6B3D burnt orange for trust and key actions
- **Secondary Accent:** #F2471D ember tone for hovers and active states
- **Depth Accent:** #3A120A for glows, borders, and low-light contrast
- **Highlight Accent:** #FF915E for informational emphasis
- **Dark Background:** #020711 with gradient variations
- **Security States:** 5 distinct visual states (critical, warning, success, info, neutral)
- **Trust Indicators:** Visual levels for progressive disclosure

### Component Library

#### Enhanced Header
- Transparent header variant with scroll detection
- Auth controls with live status indicators
- Theme toggle (dark/light modes)
- Responsive navigation

#### Hero Sections
- Dynamic backgrounds with subtle animations
- Security indicator integration
- Trust metrics display
- Split-screen layouts for demonstrations

#### Interactive Components
- Feature grids with hover effects
- Progressive disclosure patterns
- Scroll-triggered reveal animations
- Interactive card states

#### Authentication Flows
- Styled auth forms with validation
- State indicators (locked, authenticated, pending, expired)
- Security compliance badges
- Trust level visualizations

### Motion & Interaction
- Hardware-accelerated animations
- Scroll-triggered reveals with stagger delays
- Progressive disclosure animations
- Subtle background pulses
- Hover state enhancements
- Reduced motion support for accessibility

### Performance
- Vite-powered build with code splitting
- Optimized asset delivery
- Lazy loading for images
- Minified and compressed output
- Source maps for debugging

### Accessibility (WCAG 2.1 AAA)
- **Security States**: 5 distinct visual states (critical, warning, success, info, neutral)
- Enhanced keyboard navigation with skip links
- Screen reader optimization with ARIA support
- 44x44px minimum touch targets
- High contrast mode support
- Focus indicators with 3px outline
- Reduced motion preferences honored

See `/docs/DESIGN_SYSTEM.md` for complete documentation.

## Browser Demo

The operator demo is available at `/pages/demo.html`. Authenticate with the header login control to explore live metrics, health grids, and scenario-driven simulations tailored for defense operations.

## Build & Deployment

### Production Build
```bash
npm run build
```

Outputs optimized files to `dist/`:
- Minified CSS and JavaScript
- Optimized images
- Code-split modules for faster loading
- Source maps for debugging

### Deployment
Deploy the contents of the `dist/` directory to your web server. The site is a static build with no server-side dependencies (except for authentication features which require the Python backend).
