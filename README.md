# FitFlow

[![CI](https://github.com/rahman-997/fitflow-gym/actions/workflows/ci.yml/badge.svg)](https://github.com/rahman-997/fitflow-gym/actions/workflows/ci.yml)

![FitFlow product preview](public/og.png)

**A product-focused fitness PWA built with Next.js, React, and TypeScript.** FitFlow turns a simple fitness landing page into an interactive training product: users can discover programs, generate a recommendation, run guided intervals, track a training week, and install the experience on supported devices.

**Live:** [fitflow-gym-online.netlify.app](https://fitflow-gym-online.netlify.app) · **Case study:** [Portfolio](https://abdulrahman-hajjar-dev.netlify.app/work/fitflow/) · **Engineer:** [Abdulrahman Hajar](https://github.com/rahman-997)

---

## Engineering snapshot

| Area | Implementation |
| --- | --- |
| Product | Personalized training recommendation, programs, weekly progress, guided intervals |
| Frontend | Next.js 16, React 19, TypeScript 5 |
| State | Device-local progress using browser storage |
| PWA | Web App Manifest, service worker, installable/offline-ready core |
| UX | Responsive layouts, keyboard focus, reduced motion, semantic landmarks |
| Quality | ESLint, project checks, production build validation, GitHub Actions CI |

## Why this project exists

FitFlow is designed as a compact product-engineering exercise rather than a static marketing page. The core flow is intentionally end to end:

```text
Discover a program
      ↓
Generate a recommendation
      ↓
Run a guided session
      ↓
Track the training week
      ↓
Return with progress preserved
```

That flow creates real application state, persistence, timing behavior, accessibility requirements, responsive edge cases, and offline considerations without requiring a backend account system.

## Product capabilities

- Personalized plan builder based on goal and weekly availability
- Filterable strength, cardio, and mind-body program library
- Guided interval timer with HIIT, strength, and mobility presets
- Weekly workout tracker with device-local persistence
- Progress percentage, completion state, and weekly reset
- Installable Progressive Web App behavior
- Offline-ready core shell and assets
- Coach profiles, member journeys, and accessible FAQ interactions
- Responsive navigation and layouts across mobile, tablet, and desktop
- Open Graph metadata and branded social preview

## Engineering decisions

### Local-first progress

Training progress is intentionally stored on the device. For this product scope that keeps the experience fast and private, removes authentication friction, and avoids adding backend complexity that does not improve the core user journey.

### Progressive Web App behavior

The app ships a manifest and service worker so the product can be installed and retain a useful core experience when connectivity is limited. PWA support is treated as product behavior, not only a Lighthouse checkbox.

### Accessibility as a system requirement

Interactive controls include keyboard-visible focus, semantic structure, accessible state, skip navigation, live progress feedback, and reduced-motion support.

### Responsive product UI

The design system uses fluid type, CSS Grid/Flexbox, custom properties, and breakpoint-aware layouts so training flows remain usable across screen sizes instead of simply shrinking desktop components.

## Tech stack

```text
Next.js 16
React 19
TypeScript 5
CSS Grid / Flexbox / Custom Properties
Browser localStorage
Web App Manifest
Service Worker
GitHub Actions
```

## Project structure

```text
app/
  layout.tsx       metadata and document shell
  page.tsx         product content, state, and interactions
  globals.css      responsive design system
public/
  assets/          local product imagery
  og.png           social sharing card
  sw.js            offline asset strategy
  manifest.webmanifest
```

## Run locally

```bash
git clone https://github.com/rahman-997/fitflow-gym.git
cd fitflow-gym
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm test
npm run build
```

The repository also includes GitHub Actions CI so code-quality and production-build checks are repeatable outside a developer machine.

## Accessibility checklist

- Semantic landmark and heading structure
- Skip-to-content navigation
- Visible keyboard focus
- Accessible control labels and pressed states
- Live progress announcements
- Reduced-motion preference support
- High-contrast primary actions

## Author

Designed and developed by **[Abdulrahman Hajar](https://github.com/rahman-997)** — Software Engineer and Full-Stack Developer in Istanbul, Türkiye.

## License

Released under the [MIT License](LICENSE).
