# تدبّر — Tadabbur website

A static, GitHub-Pages-ready site for the Tadabbur Quran-reflection archive.

- **Quran map** — browse all 604 mushaf pages; search by surah, juz, or page.
- **Page view** — each page opens its Tadabbur 1 & Tadabbur 2 recordings **embedded at the exact
  timestamp** the page was discussed, plus the transcript text and (where available) the ayah text + translation.
- **Speaker profiles** — per-presenter stats: pages, surahs, minutes, timeline, full presentation list
  with deep-links to the video moment.
- **Global search** in the header (pages, surahs, speakers).

## Host on GitHub Pages
1. Commit this repo.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main`, folder: **`/docs`**. Save. The site appears at `https://<user>.github.io/<repo>/`.

Fully static — no build step. Fonts load from Google Fonts; videos embed from YouTube
(both fine on GitHub Pages). `.nojekyll` keeps the `data/` folder served verbatim.

## Regenerate the data
The site reads `docs/data/*` (generated from the repo's metadata + transcripts):
```
python3 build.py     # rewrites docs/data/{meta,pages,speakers}.json + docs/data/pages/<n>.json
```

## Data layer
- `data/meta.json` — global stats + surah/juz reference (Madani 604-page layout).
- `data/pages.json` — light index of all 604 pages (surah, juz, coverage, presenters).
- `data/pages/<n>.json` — per-page detail: T1/T2 {presenter, date, youtube_id, start/end, transcript text}, quran verses (pp.1–70 baked; others link to quran.com).
- `data/speakers.json` — per-speaker stats + full presentation list.
