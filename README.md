# Scholarship Assistant

A simple, clean web dashboard that helps students discover scholarships and generate high-quality application essays with AI.

## Features

- **Scholarship Discovery** – Browse a curated catalog of scholarships with deadlines, amounts, and eligibility details.
- **Guided Application Flow** – Multi-step wizard captures your profile, personal background, and scholarship-specific answers.
- **AI Essay Writer** – Generate, improve, shorten, expand, or regenerate essays with one click.
- **Tone Selector** – Choose from Inspirational, Professional, Personal Story, or Bold voice styles.
- **Local-First Storage** – No login required. Your profile, answers, and essays are saved in your browser.
- **Essay Memory** – Reuse your saved profile and past essays to make future applications faster and better.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Lovable Cloud (Supabase backend)
- Lovable AI Gateway for essay generation

## Getting Started

```bash
# Install dependencies
bun install

# Run locally
bun run dev
```

## Project Structure

- `src/pages/` – Dashboard, scholarship detail, application flow, profile
- `src/lib/localStore.ts` – localStorage persistence for user data
- `src/lib/scholarship.ts` – Scholarship types and helpers
- `supabase/functions/generate-essay/` – Edge function that calls Lovable AI

## How It Works

1. Browse scholarships on the home page.
2. Click "Apply" on any scholarship to start the guided flow.
3. Fill in your profile (reused across all applications).
4. Answer a few scholarship-specific questions.
5. Pick a tone and hit "Generate my essay."
6. Iterate with AI tools (Improve, Stronger, Shorten, Expand).
7. Copy the final essay or mark it as submitted.

---

Built with [Lovable](https://lovable.dev)
