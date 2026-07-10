# ARKT Consulting — Website

Premium single-page landing site built from the ARKT brand guidelines
(Executive Navy / Signature Gold, Manrope + Inter + Oswald) and the master
UI/animation brief.

## Structure

```
arkt-website/
  index.html          single page, anchored navigation
  css/styles.css      brand design system (colours, type, layout, motion styles)
  js/main.js          GSAP animations + interactions (progressive enhancement)
  js/vendor/          gsap.min.js, ScrollTrigger.min.js (self-hosted)
  assets/fonts/       Manrope, Inter, Oswald (self-hosted woff2)
  assets/images/      optimized WebP assets, organised per site section
```

## Run locally

Any static server works, e.g.:

```
npx http-server arkt-website -p 4173
```

Or simply open `index.html` in a browser (all assets are local).

## Deploy

Upload the whole `arkt-website` folder to any static host
(cPanel public_html, Netlify, Cloudflare Pages, Vercel, GitHub Pages).
No build step is required.

## Contact form — action needed

The form currently has **no backend**. Until one is connected, submitting
opens the visitor's email app with the enquiry pre-filled and addressed to
info@arktconsulting.co.za (no fake "sent" confirmation is shown).

To connect a real endpoint (e.g. Formspree, Web3Forms, or your own API),
set `FORM_ENDPOINT` near the top of the form section in `js/main.js`:

```js
var FORM_ENDPOINT = "https://formspree.io/f/XXXXXXX";
```

The handler already POSTs JSON and shows proper loading / success / error states.

## Asset notes

Two images listed in the naming convention were not present in
`Website Picture Assets`, so:

- **Business Services** card uses the business-dashboard visual
  (`arkt-home-strategy-support-...`), which fits the content well.
- The About "Simplify Complexity process flow" visual was replaced by a
  restrained animated line-convergence motif (SVG), matching the brief's
  "complex lines converge into an ordered line" direction.

If those two images are produced later, drop them into
`assets/images/services/business/` and `assets/images/about/complexity/`
and update the two `<img>` tags in `index.html`.

## Accessibility & motion

- All animation respects `prefers-reduced-motion` (static, fully readable page).
- Content is fully visible without JavaScript.
- Keyboard: skip link, focus-visible rings, Escape closes the mobile menu,
  accordion/index is button-based with `aria-expanded`.
