# PetPawSphere Brand Guidelines — Concept 2 (P-Letter Mark)

**Version:** v2 (2026-04-26)
**Supersedes:** v1 Majlis "quiet concierge" direction
**Status:** Active — all UI work follows these specs

---

## 1. Brand mark

The P-letter mark is the heart of the system. A bold navy capital "P" contains an orange paw print inside the bowl. The mark IS the favicon, the app icon, the document seal, and the stamped-anywhere identifier.

```
Navy P stem  →  bold geometric, no serifs, full-height vertical
P bowl       →  rounded right-side bowl, 60-65% the height of stem
Orange paw   →  centered inside the bowl, 70-80% of bowl interior
```

### Files

| File | ViewBox | Use |
|---|---|---|
| `packages/web/public/brand/seal.svg` | 256×256 | Square mark — favicon, app icon, document seal |
| `packages/web/public/brand/wordmark.svg` | 1320×500 | Full lockup — P-mark + wordmark + tagline + U·A·E (landing hero, splash) |
| `packages/web/public/brand/wordmark-only.svg` | 720×200 | Text-only horizontal — navbar, footer (currentColor, theme-adaptive) |
| `packages/web/public/favicon-32.png` | 32×32 PNG | Legacy browser fallback (regenerated from seal.svg) |
| `packages/web/public/apple-touch-icon.png` | 180×180 PNG | iOS home-screen icon (regenerated from seal.svg) |

## 2. Wordmark

Two-tone color split. The middle word "Paw" is the accent — orange — bracketed by navy "Pet" and "Sphere".

```
PetPawSphere
└─┬─┘└─┬─┘└──┬──┘
 navy orange navy
```

### Typography

- **Family:** `'Nunito', 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Weight:** 800 (extra-bold) for the wordmark
- **Letter-spacing:** -2 (tight, optical bond)
- **Case:** PascalCase exactly — `PetPawSphere`. Never all-lowercase, never all-caps, never split with a space.

## 3. U·A·E locale lockup

Beneath the wordmark, three letters tracked widely apart with UAE flag colors and flanking horizontal lines.

```
─────  U  A  E  ─────
       └  └  └
       red green red
```

- `U` = `#CE1126` (UAE red)
- `A` = `#00732F` (UAE green)
- `E` = `#CE1126` (UAE red)
- Letter-spacing: +20 (loose tracking)
- Flanking lines: 1.5px stroke navy, on either side of the letter group, centered

## 4. Tagline

**Primary:** `Care · Connect · Companion`

Set in slate `#5A6478`, weight 600, letter-spacing 6, sized small relative to the wordmark. Sits between the wordmark and the U·A·E lockup in the full lockup.

**Alternative taglines** for marketing surfaces (not the brand lockup):
- "All Your Pet World, One Sphere"
- "Everything Your Pet World Needs"

## 5. Color palette

| Role | Hex | Tailwind name suggestion |
|---|---|---|
| Navy (ink-primary) | `#131D40` | `ink` |
| Orange (accent / paw) | `#F57C00` | `accent` |
| Teal (secondary) | `#3FB1B5` | `teal` |
| Slate (tagline) | `#5A6478` | `muted` |
| UAE Red | `#CE1126` | `uae-red` |
| UAE Green | `#00732F` | `uae-green` |

## 6. Theme adaptation

`wordmark-only.svg` uses `currentColor` for the navy "Pet" and "Sphere" so the wordmark inherits the parent's text color. In light theme it appears navy on white; in dark theme it appears cream on dark navy. The orange "Paw" and the UAE flag colors stay constant in both themes.

`wordmark.svg` and `seal.svg` use explicit colors (no `currentColor`) so the brand mark is theme-stable when used as `<img src>`. This is the right call for a logo that must be recognizable regardless of context.

## 7. What NOT to do

- ❌ Don't use Fraunces serif anywhere — that was the v1 Majlis direction (now dead)
- ❌ Don't use cream `#F7F2E8` or gold `#C9A86A` — Majlis colors, no longer in the system
- ❌ Don't add "EST · 2026" or "BILINGUAL" sub-text — those were Majlis-era devices
- ❌ Don't split the brand name with a space ("Pet Paw Sphere"). It's one word: `PetPawSphere`
- ❌ Don't recolor the orange paw or change its shape — it's a fixed mark
- ❌ Don't use the P-mark without the paw inside the bowl — they're inseparable

## 8. Visual reference (from user 2026-04-26 brand pivot)

The user provided three concept images. **Concept 2 was selected.** Key visual elements:

- Bold navy capital "P" letter as the primary brand mark
- Inside the P's bowl: white dog silhouette + teal cat silhouette + orange paw print (the cat/dog silhouettes are stylistic — current implementation uses just the orange paw for clarity at favicon scales; silhouettes are reserved for v2.1 if user wants them inside the larger wordmark.svg)
- "PetPawSphere" wordmark with "Pet" navy / "Paw" orange / "Sphere" navy
- Tagline "Care · Connect · Companion" beneath
- "U A E" lockup with red-green-red flag-color letters and flanking lines
- A row of feature icons (Health Records, Walking, Match & Connect, Gallery, Buy & Sell, Consultation) — implemented separately as utility icons, not part of the wordmark itself

## 9. Future iterations

Items not yet implemented (deferred to v2.1 or beyond):

1. **Dog + cat silhouettes inside the wordmark.svg P-bowl** — current implementation uses orange paw only. Adding silhouettes is a v2.1 enhancement once the user signs off on this baseline.
2. **Feature icon set** (Health Records, Walking, Match, Gallery, Buy/Sell, Consult) — colored monochrome icons for the bottom utility row in marketing surfaces.
3. **og-image regeneration** — the og-image.png still references the old brand. Regenerate from wordmark.svg at 1200×630 with a centered composition.
4. **Outline text to paths** — for absolute typography stability across systems without Nunito installed. Defer until brand v2 is signed off; do this in Figma export pass.
5. **Arabic-script wordmark variant** — for AR locale rendering. Hand-drawn by a native Arabic typographer; FLUX cannot generate legitimate Arabic.
