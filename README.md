# Guest Invitation Card Generator

A single-file static web app. Fill in **Supplier Name**, **Appointment Date (Mon/Tue)**,
**Contact Person**, and **Signature**, and it builds a printable invitation card live in the browser.

- **No database, no backend, no accounts.** Everything runs in the browser.
- Nothing is stored or sent anywhere — safe for free static hosting.
- Output: **Print / Save as PDF** or **Download PNG**.

## Preview locally

Just open `index.html` in a browser (double-click it), or via XAMPP at
`http://localhost/guest/`.

## Deploy to Vercel (free)

**Option A — drag & drop (no tools):**
1. Go to https://vercel.com and sign up (free Hobby plan).
2. Zip this folder, or use the Vercel dashboard's "Deploy" → drag the folder in.

**Option B — CLI:**
```bash
npm i -g vercel
cd guest
vercel        # first run links/creates the project
vercel --prod # publish to production URL
```

That's it — Vercel serves `index.html` as a static site. No configuration needed.

## Customize
Open `index.html` and change:
- The LamAsia logo is inlined as a base64 data URI in the `const LOGO = "data:image/png;base64,..."`
  line near the top of the `<script>`. To swap it, base64-encode a new image and replace that string
  (`logo.png` is the transparent-background source; `logo.jpg` / the `viber_...jpg` are the originals).
- Colors: edit the `--brand` / `--accent` CSS variables near the top.
- Badge / heading text: search for `Visitor Invitation` and `You're Invited`.
