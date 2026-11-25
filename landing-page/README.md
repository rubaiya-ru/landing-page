# StrategyByte landing page (demo)

A one-page landing site for **StrategyByte**, featuring **ByteVoice**, the AI receptionist, and its 3D mascot **Kilo the quokka**.

It's plain HTML, CSS and JavaScript with no build step. The only external code is [three.js](https://threejs.org) (for the 3D mascot), loaded from the jsDelivr CDN.

> This is a demonstration page. The sign-up, Book a demo and Sign in forms validate input in the browser and show a confirmation, but **nothing is stored or sent anywhere**.

## Files

```
index.html             Page markup, including the Book a demo and Sign in dialogs
styles.css             Styles, using the ByteVoice brand tokens (--bv-*)
script.js              Header, mobile menu, dialogs, the three forms, industry ticker
assets/js/kilo-model.js  Kilo built from 3D shapes, plus lights and environment
assets/js/kilo3d.js      Hero 3D scene: rendering, idle animation, pointer follow
assets/kilo-3d.webp    Still render of Kilo (shown while 3D loads, if WebGL is off, and on the product card)
assets/kilo-head.png   Still render of Kilo's head (favicon and confirmation messages)
vercel.json            Vercel settings (clean URLs, security headers)
```

## The 3D mascot

Kilo is rendered live with three.js in the hero. He bobs, blinks, waves, and his head gently follows the pointer. When someone signs up, he does a small hop.

- The still image `assets/kilo-3d.webp` shows first, and the live 3D fades in once it's ready.
- If WebGL isn't available, or three.js can't load, the still image simply stays.
- Rendering pauses when Kilo is scrolled off-screen or the tab is hidden.
- With "reduce motion" turned on in the operating system, Kilo is shown as a single still frame.

Lighting follows the brand guidelines: a warm key light from the upper left, a cyan rim light from the lower right, and a gold fill. Cyan only appears as light, never as a surface colour.

To re-render the still images after changing the model, open the page with `?kilo-debug` in the URL. This exposes the scene as `window.__kilo` so a frame can be rendered at any size and saved.

## Brand notes

Colours, type and button styles follow the ByteVoice hero design system:

- **Night navy** (`#0A1129`) ground, **ByteVoice gold** (`#F2CB1D`) accent (about 10% of a view), **cream** (`#FBF8F1`) type and light sections.
- Text on gold is always navy-950.
- Shadows are navy-tinted, never grey or black.
- Fonts: Outfit (display), Inter Tight (body/UI), IBM Plex Mono (labels), loaded from Google Fonts.
- Copy is written in a polite, formal tone, with no slang.

## Run locally

The 3D scene uses JavaScript modules, so serve the folder rather than opening the file directly:

```bash
npx serve .
```

## Push to GitHub

```bash
git init
git add .
git commit -m "StrategyByte landing page"
git branch -M main
git remote add origin https://github.com/<your-account>/<repo-name>.git
git push -u origin main
```

## Deploy on Vercel

1. Go to vercel.com → **Add New… → Project** and import the GitHub repo.
2. Framework preset: **Other**. Leave Build Command and Output Directory empty.
3. Click **Deploy**. Every push to `main` redeploys automatically.

Or from the terminal: `npx vercel` (preview) and `npx vercel --prod` (production).
