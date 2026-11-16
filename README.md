# InternTrack

Internship application tracker with AI job analysis.

Keep every internship application in one place, never miss a deadline, and
prepare applications faster: the AI compares a job posting with your CV and
drafts a cover letter.

> **Status:** work in progress. Stage 0 (project setup) is done; see the
> [roadmap](#roadmap).

## Planned features

- Sign up and sign in: every user sees only their own data
- Applications with company, role, job link, location, deadline and notes
- Kanban board: Wishlist → Applied → Test → Interview → Offer / Rejected,
  with drag and drop between columns
- Application history: what happened, when, and what the next step is
- Deadline highlighting: red within 3 days, yellow within a week
- AI analysis: matches with your CV, gaps, and what to emphasise
- Editable cover letter draft for a specific job posting
- Statistics: applications sent, replies, and the stage where rejections happen

## Tech stack

| Layer         | Technology                 |
| ------------- | -------------------------- |
| UI            | React + TypeScript + Vite  |
| Styles        | Tailwind CSS               |
| Drag and drop | dnd-kit                    |
| Auth and data | Supabase (Postgres, Auth)  |
| AI server     | Netlify Functions, Node.js |
| Hosting       | Netlify                    |
| Tests         | Vitest                     |

The app reads and writes applications in Supabase directly, protected by Row
Level Security. Job postings and the CV go to a server function, which is the
only place that knows the LLM API key.

## Getting started

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Denchik509/interntrack.git
cd interntrack
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

## Scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start the local dev server            |
| `npm run build`      | Type-check and build for production   |
| `npm run preview`    | Serve the production build locally    |
| `npm run test`       | Run the tests once                    |
| `npm run test:watch` | Re-run the tests on every change      |
| `npm run lint`       | Lint the code with oxlint             |

## Roadmap

- [x] 0. Setup: Vite + React + TypeScript, Tailwind, Vitest, Netlify config
- [ ] 1. Auth and database: tables, Row Level Security, sign-in screens
- [ ] 2. Applications as a list: create, edit, delete
- [ ] 3. Kanban board with drag and drop
- [ ] 4. Application panel, history and deadline highlighting
- [ ] 5. AI: server function, job analysis, cover letter draft
- [ ] 6. Statistics
- [ ] 7. Polish: mobile layout, PWA, dark theme, empty states, tests

## Progress log

### Stage 0 — Setup

- Scaffolded the app from the official Vite `react-ts` template
- Added Tailwind CSS 4 with design tokens for the accent and status colors
- Added Vitest and the Netlify build configuration
- Documented environment variables in `.env.example`
