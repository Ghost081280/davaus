# davaus.com

Mobile-first website for **Davaus LLC** &mdash; agricultural products built by farmers, for farmers. Hoagland, Indiana.

> Status: kickoff preview. Framework is complete (nav, footer, chatbot, scroll progress, mod loader, hero, products, story, videos, contact). Content is pulled from the existing davaus.com but images, full product pages, and dealer pages are not yet built.

---

## What is in this repo

```
site/
  index.html               Homepage
  404.html                 Themed 404 page
  favicon.svg              Wheat-kernel mark, harvest gold on loam dark
  css/
    styles.css             Theme tokens, base, nav, footer, components, responsive
    index.css              Homepage section styles (hero, products, story, videos, contact)
  js/
    config.js              Single config object (window.DAVAUS_CONFIG)
    components.js          Mod loader (nav/footer/chatbot), scroll progress, mobile menu, particles, reveal-on-scroll
    main.js                Anchor smooth-scroll, lazy YouTube loader, contact form mailto
    index.js               Hero stat counter animations
  components/
    nav.html               Desktop nav + mobile slide-from-right menu
    footer.html            3-column footer with social SVGs
    chatbot.html           Jarvis chatbot shell
    chatbot.css            Chatbot theme (mobile keyboard-aware, safe-area respecting)
    chatbot.js             Chatbot client (rate-limited, session-persistent, product-grounded fallback)
  images/                  Empty. Drop logo + photos here.
```

## Design system

| Token | Value | Use |
|---|---|---|
| `--loam-black` | `#14110D` | Page background |
| `--loam-dark` | `#1B1813` | Card background |
| `--harvest-gold` | `#D4A437` | Primary accent, links, headings |
| `--copper-rust` | `#C76B3D` | Secondary accent, hover states |
| `--cream` | `#F4EEDF` | Body text |
| `--cream-dim` | `#A89F8C` | Muted text |

**Typography:** Fraunces (display serif, with SOFT/WONK variations) + Inter Tight (body). Both loaded from Google Fonts.

**Ambient effect:** Drifting golden kernel particles (parallel to SquidBay's bubbles &mdash; same engine, different aesthetic).

## Mod system

`js/components.js` loads three components into placeholder divs on every page:

```html
<div id="nav-placeholder"></div>      <!-- replaced by components/nav.html -->
<div id="footer-placeholder"></div>   <!-- replaced by components/footer.html -->
<!-- chatbot is auto-injected at end of body -->
```

When all three are loaded, a custom event fires:

```js
window.addEventListener('davaus:components-loaded', () => { ... });
```

This is the same architecture as `squidbay.io` &mdash; new pages just need the two placeholders and the script tags.

## Adding a new page

1. Copy `index.html`, rename to `your-page.html`.
2. Strip the section content, keep `<head>`, `<header>`, placeholders, and script tags.
3. Add page-specific CSS as `css/your-page.css` and a page-specific JS as `js/your-page.js`.
4. Link them in the `<head>` and before `</body>`.

## Where to put images

All images live in `/images/`. Referenced from HTML/CSS as `/images/name.ext`. Recommended:

- `images/logo.svg` &mdash; full Davaus wordmark, replace nav `.logo-mark` placeholder
- `images/logo-icon.svg` &mdash; just the mark, for favicon and small placements
- `images/og-image.png` &mdash; 1200&times;630 social card, referenced in `<meta og:image>`
- `images/farm-photo.jpg` &mdash; story section visual, currently a SVG placeholder
- `images/products/seedright.jpg`, `kernel-keeper.jpg`, `ride-tamer.jpg` &mdash; product card visuals
- `images/favicon.ico` &mdash; legacy fallback (modern browsers use `favicon.svg`)

## Chatbot

`components/chatbot.js` calls `window.DAVAUS_CONFIG.chatBackend` (default `https://api.davaus.com/chat`). When the backend is unreachable, it returns rich knowledge-grounded fallback responses about SeedRight, Kernel Keeper, Ride Tamer, dealers, contact info, and the company story &mdash; so it stays useful even before a backend exists.

When you wire up a backend, it must accept:

```json
POST /chat
{ "message": "user text", "sessionId": "uuid" }
```

and return:

```json
{ "reply": "assistant text" }
```

## Local preview

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

This is set up for **Railway** static hosting (matches your existing setup) and **Cloudflare** for DNS / domain. GitHub Pages also works for preview.

## Updating content

Once you are comfortable, you can ask Claude Opus 4.7 to update the site by giving it this repo and a prompt like: *"Update the products section to add a fourth card for [Product Name] with these specs..."*. See `AUSTIN-GUIDE.md` for the full onboarding walkthrough.

## Tech notes

- No build step. No bundler. No framework.
- All JS runs in the browser as ES2017+ modules-style files (no `import`/`export` &mdash; classic scripts).
- All YouTube embeds are lazy-loaded via IntersectionObserver &mdash; initial pageload stays light.
- Mobile-first: breakpoints at 480px, 640px, 920px.
- No external trackers. No ads. No third-party fonts beyond Google Fonts.

---

Built with care by Andrew at SquidBay for Austin at Davaus.
