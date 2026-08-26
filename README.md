# FitFlow Fitness

[![CI](https://github.com/rahman-997/fitflow-gym/actions/workflows/ci.yml/badge.svg)](https://github.com/rahman-997/fitflow-gym/actions/workflows/ci.yml)

![FitFlow Fitness social preview](public/og.png)

A polished, responsive fitness experience that helps users discover programs, generate a personalized training recommendation, run guided workout intervals, and track weekly progress.

**[Live demo](https://fitflow-gym-online.netlify.app)** · **[Case study](https://abdulrahman-hajjar-dev.netlify.app/work/fitflow/)** · [Portfolio](https://abdulrahman-hajjar-dev.netlify.app) · [LinkedIn](https://www.linkedin.com/in/abdulrahman-hajjar-5430281a1/) · [Developer profile](https://github.com/rahman-997)

## Highlights

- Personalized plan builder based on goal and weekly availability
- Filterable strength, cardio, and mind-body program library
- Interactive weekly workout tracker with device-local persistence
- Guided interval timer with HIIT, strength, and mobility presets
- Installable Progressive Web App with offline-ready core screens
- Progress percentage, completion states, and weekly reset
- Coach profiles, member journeys, and accessible FAQ accordions
- Responsive navigation and layouts for mobile, tablet, and desktop
- Keyboard focus states, semantic landmarks, skip link, and reduced-motion support
- Open Graph and X metadata with a custom branded social card

## Tech stack

- Next.js 16
- React 19
- TypeScript 5
- Modern CSS with Grid, Flexbox, custom properties, and fluid typography
- Browser `localStorage` for private device-local progress
- Web App Manifest and Service Worker for installable app behavior
- ESLint and production build validation

## Getting started

```bash
git clone https://github.com/rahman-997/fitflow-gym.git
cd fitflow-gym
npm install
npm run dev
```

Open the local address shown in the terminal.

## Available scripts

```bash
npm run dev      # start the development server
npm run lint     # run code-quality checks
npm run build    # create a production build
npm test         # run the project checks
```

## Project structure

```text
app/
  layout.tsx       site metadata and document shell
  page.tsx         content, state, and interactions
  globals.css      responsive design system
public/
  assets/          local fitness imagery
  og.png           social sharing card
  sw.js            offline asset strategy
  manifest.webmanifest
```

## Product decisions

FitFlow is designed around a simple conversion path: discover a suitable program, receive a clear recommendation, run a focused session, then build consistency by checking off the current week. Progress is intentionally stored on the user’s device, keeping the experience fast and privacy-friendly without requiring an account.

The visual system combines deep forest tones, editorial serif headlines, energetic lime accents, rounded geometry, and restrained motion to create a premium but approachable fitness identity.

## Accessibility

- Semantic heading and landmark structure
- Accessible labels and pressed states for interactive controls
- Keyboard-visible focus treatment
- Skip-to-content navigation
- Live progress announcements
- Reduced-motion preference support
- High-contrast primary actions

## Author

Designed and developed by [Abdulrahman Hajjar](https://abdulrahman-hajjar-dev.netlify.app), Frontend Engineer based in Istanbul, Türkiye.

## License

Released under the [MIT License](LICENSE).
