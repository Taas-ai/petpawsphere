# PetPawSphere Brand Guidelines — Concept 1 (Ring + Pets + Orbital Hub)

**Version:** v3 (2026-04-26)
**Supersedes:** v1 Majlis (gold/cream/serif) and v2 P-mark (the previous mistaken interpretation)
**Status:** Active — all UI work follows these specs

---

## 1. Brand mark

A **teal circular ring** containing a **dog silhouette** (teal, drooping ear) on the left, a **cat silhouette** (white with teal outline, pointy ears) on the right, and an **orange paw print** with a **pink heart** inside its main pad at the bottom-center inside the ring. Around the outside of the ring, **seven colored feature icons** orbit along a thin curving teal arc — each icon represents a platform feature (Health Records, Vaccination, Buy/Sell, Pet, Match/Connect, Walking, Gallery).

The mark works at every scale:

- **At hero scale** (1400×500): the ring + pets + paw + all 7 orbital icons + the wordmark + tagline + U·A·E lockup
- **At seal/favicon scale** (256×256 → 32×32): just the ring + pets + paw (orbital icons drop off below 128×128)

### Files

| File | ViewBox | Use |
| --- | --- | --- |
| `packages/web/public/brand/seal.svg` | 256×256 | Square mark — favicon, app icon, document seal |
| `packages/web/public/brand/wordmark.svg` | 1400×500 | Full lockup — ring + pets + orbital icons + wordmark + tagline + U·A·E (landing hero, splash) |
| `packages/web/public/brand/wordmark-only.svg` | 720×200 | Text-only horizontal — navbar, footer (`currentColor` for theme adaptation) |
| `packages/web/public/favicon-32.png` | 32×32 PNG | Legacy browser fallback (regenerated from seal.svg) |
| `packages/web/public/apple-touch-icon.png` | 180×180 PNG | iOS home-screen icon (regenerated from seal.svg) |

## 2. Wordmark

Two-tone color split. The middle word "Paw" is the accent — **teal** — bracketed by **navy** "Pet" and "Sphere".

```text
PetPawSphere
└─┬─┘└─┬─┘└──┬──┘
 navy teal  navy
```

### Typography

- **Family:** `'Nunito', 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Weight:** 800 (extra-bold) for the wordmark
- **Letter-spacing:** -2 (tight)
- **Case:** PascalCase exactly — `PetPawSphere`. Never split with a space.

## 3. Tagline

**Primary:** `Care · Connect · Share · Shop · Consult`

Set in slate `#5A6478`, weight 600, letter-spacing 6. Sits between the wordmark and the U·A·E lockup. The five words map directly to the five platform pillars represented by the orbital feature icons.

## 4. U·A·E locale lockup

```text
─────  U  A  E  ─────
       └  └  └
       red green red
```

- `U` = `#CE1126` (UAE red)
- `A` = `#00732F` (UAE green)
- `E` = `#CE1126` (UAE red)
- Letter-spacing: +20 (loose tracking)
- Flanking lines: 1.5px stroke navy on either side

## 5. Color palette

| Role | Hex | Usage |
| --- | --- | --- |
| Teal (primary) | `#1B8587` | Ring, dog silhouette, "Paw" word in wordmark |
| Orange (accent) | `#F57C00` | Paw print + Buy/Sell orbital icon |
| Navy (ink) | `#0F1B3B` | "Pet"/"Sphere" wordmark, eye details, body text |
| White | `#FFFFFF` | Cat silhouette fill, card surfaces |
| Heart pink | `#E94560` | Heart inside paw + Match/Connect orbital icon |
| Slate | `#5A6478` | Tagline subtext |
| UAE Red | `#CE1126` | "U" + "E" in locale lockup |
| UAE Green | `#00732F` | "A" in locale lockup |
| Orbital — yellow | `#FFC42E` | Health Records (clipboard) + Gallery (camera) |
| Orbital — green | `#4DBB6A` | Vaccination (shield + plus) |
| Orbital — purple | `#9C5BBE` | Match/Connect (users) |
| Orbital — blue | `#3D8BFF` | Walking (walker) |

## 6. Theme adaptation

`wordmark-only.svg` uses `currentColor` for the navy "Pet" and "Sphere" so the wordmark inherits the parent's CSS `color`. In light theme it appears navy on white; in dark theme it appears cream on dark navy. The teal "Paw" + UAE flag colors stay constant in both themes.

`wordmark.svg` and `seal.svg` use explicit colors (no `currentColor`) so the brand mark is theme-stable when used as `<img src>`.

## 7. Orbital feature icons

Seven colored circular icons orbit around the upper portion of the ring along a thin curving teal arc:

| Position | Color | Icon | Feature |
| --- | --- | --- | --- |
| Top-left | Yellow `#FFC42E` | Clipboard | Health Records |
| Top | Green `#4DBB6A` | Shield + plus | Vaccination |
| Top-right | Orange `#F57C00` | Cart | Buy/Sell |
| Right | Pink `#E94560` | Paw | Pet listings |
| Mid-right | Purple `#9C5BBE` | Two heads | Match/Connect |
| Bottom-right | Blue `#3D8BFF` | Walker | Walking services |
| Bottom | Yellow `#FFC42E` | Camera | Photo gallery |

Each icon is a 18px-radius colored disc with a simplified white symbol inside.

## 8. What NOT to do

- ❌ Don't use Fraunces serif anywhere — that was v1 Majlis (dead)
- ❌ Don't use the navy P-letter container — that was v2 (a misread of the reference)
- ❌ Don't use cream `#F7F2E8` or gold `#C9A86A` — Majlis-era colors, no longer in the system
- ❌ Don't recolor the orange paw or change its shape — it's a fixed mark
- ❌ Don't use the ring without the pets and paw inside — they're inseparable
- ❌ Don't use the wordmark without the U·A·E lockup unless space genuinely doesn't allow it (e.g., 32×32 favicon — use the seal there)

## 9. Visual reference

User-provided 2026-04-26 brand reference images. Concept 1 was selected for:

- Most literal, instantly readable as "pet platform"
- Pet-pet bond positioning (dog + cat together) appropriate for the platform's matching/breeding focus
- Multi-color orbital icons communicate platform breadth at a glance
- Strong differentiation from generic pet apps

## 10. Future iterations (deferred)

1. **Higher-fidelity dog and cat silhouettes** — current implementation uses simplified geometric shapes. A v3.1 enhancement would refine to more realistic profile silhouettes.
2. **Orbital icon symbol detail** — current implementation has simplified white symbols inside the colored discs. Could be replaced with hand-drawn icons or Lucide icons for sharper rendering.
3. **og-image regeneration** at 1200×630 from wordmark.svg.
4. **Outline text to paths** for typography stability across systems without Nunito installed.
5. **Arabic-script wordmark variant** — by native Arabic typographer.
