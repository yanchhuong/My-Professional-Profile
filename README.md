# Yanchhuong Suon — Professional Profile

A responsive personal profile site built as a static site (HTML, CSS, and vanilla JS) with no build step, ready for Vercel.

## Structure

```
index.html        page markup
css/styles.css    styles (desktop → tablet → mobile breakpoints at 1024 / 768 / 480px)
js/main.js        SITE config, services / skills / projects data, project filter, mobile menu, contact form
assets/           images
vercel.json       Vercel headers & clean URLs
```

## Edit your details

Open `js/main.js` and fill in the `SITE` block at the top:

```js
const SITE = {
  email: 'hello@yourdomain.com',
  cvUrl: '/assets/Yanchhuong-Suon-CV.pdf',
  linkedinUrl: 'https://www.linkedin.com/in/your-handle'
};
```

Projects, services, and skills are plain arrays in the same file. The remaining placeholder text, such as the previous role and the education entries, is marked with `[brackets]` in `index.html`.

## Run locally

```bash
npx serve .
# or
python -m http.server 8000
```

## Deploy to Vercel

1. Go to https://vercel.com/new and import this GitHub repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy. Every push to `main` redeploys automatically.
