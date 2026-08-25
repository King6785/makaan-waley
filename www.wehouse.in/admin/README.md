# MAKAAN WALEY — Decap CMS Admin Setup

## Quick Start

### 1. Enable GitHub Pages (if not already)
- Go to `https://github.com/King6785/makaan-waley/settings/pages`
- Source: **Deploy from a branch**
- Branch: `main` / `(root)`
- Save

### 2. Configure Decap CMS OAuth
1. Go to `https://github.com/settings/developers` → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: `MAKAAN WALEY CMS`
   - **Homepage URL**: `https://king6785.github.io/makaan-waley/`
   - **Authorization callback URL**: `https://api.netlify.com/auth/done` (Decap uses Netlify's proxy)
3. Register → copy **Client ID** and **Client Secret**

### 3. Add OAuth Credentials to Decap CMS
Decap CMS uses Netlify Identity as an auth proxy. You have two options:

**Option A: Netlify (recommended, free)**
1. Create a Netlify account → connect your GitHub repo
2. Go to **Site settings** → **Identity** → **Enable Identity**
3. **Registration** → **Invite only**
4. **External providers** → Add **GitHub** → paste Client ID/Secret
5. **Services** → **Git Gateway** → **Enable Git Gateway**
6. Your admin will be at: `https://your-site.netlify.app/admin/`

**Option B: Self-hosted (current setup)**
Since you're on GitHub Pages, the admin at `/admin/` will work but **authentication requires Netlify's Git Gateway**. The simplest path:

1. **Deploy to Netlify** (free, connects to your GitHub repo)
2. Enable Identity + Git Gateway as above
3. Your admin works at `https://your-site.netlify.app/admin/`
4. GitHub Pages still deploys from `main` branch (Netlify pushes commits back)

### 4. Test Locally (optional)
```bash
cd /c/Users/USER/Downloads/wehouse
npx decap-server
```
Then open `http://localhost:8080/www.wehouse.in/admin/` — works with local backend (no auth needed).

---

## File Structure Created

```
www.wehouse.in/
├── admin/
│   ├── index.html          # Custom branded admin dashboard
│   └── config.yml          # Decap CMS configuration
├── content/
│   └── site-content.json   # Single source of truth for ALL content
├── images/                 # Media folder (Decap uploads here)
├── css/sitee1de.css        # Your Tailwind v4 compiled CSS
├── js/                     # Your vanilla JS
└── index.html              # Main homepage (edit via CMS, not directly)
```

---

## What You Can Edit in Admin

| Collection | What It Controls |
|------------|------------------|
| **Site Settings → Meta & SEO** | Page title, description, OG tags, favicon |
| **Site Settings → Branding** | Brand name, logos (dark/white), tagline |
| **Site Settings → Color Palette** | Primary 500/600/700, Dark shades, Success, Info — **hex values** |
| **Site Settings → Navigation** | City list, nav items + dropdowns, CTA button text |
| **Hero Section** | Kicker, headline, subheadline, CTAs, 4 stats, 6 images, 3-step form |
| **Services** | 4 service cards (title, link, CTA, icon) |
| **Trust & Media** | Section copy + 3 media logos |
| **Portfolio** | 6 project cards (ID, location, image) |
| **Why Choose Us** | 9 feature cards (title, description, optional link) |
| **Comparison Table** | 6 rows (WeHouse, Factor, Contractor) + CTA |
| **Achievements** | Section label + title |
| **E-Monitoring** | Title, description, 4 features, 2 CTAs, image |
| **Testimonials** | Client cards (name, image) |
| **Cities** | 6 city cards (name, address) |
| **FAQ** | 6 Q&A pairs (markdown answers) |
| **Referral Program** | Title, subtitle, 3 benefits, CTA |
| **Footer** | Description, 3 link groups, 6 cities, 4 socials, copyright |
| **Lead Popup** | Title, lede, 3-step field config |

---

## How Content Updates Work

1. **Edit** in `/admin/` → click **Publish**
2. Decap CMS **commits** to `King6785/makaan-waley` (main branch)
3. **GitHub Pages** detects push → rebuilds site (1-3 min)
4. **Live site** updates at `https://king6785.github.io/makaan-waley/`

> **Note**: The `index.html` is NOT auto-generated from JSON. You edit content in CMS → it updates `content/site-content.json` → you (or a build step) regenerate HTML from JSON. For true decoupling, add a build script (Eleventy, Astro, Vite, etc.) that reads `site-content.json` and generates HTML.

### Current Limitation
This setup **stores content in JSON** but your `index.html` is still static. To make changes appear on the live site, you need one of:

1. **Manual**: After CMS edits, run a script to regenerate `index.html` from `site-content.json` + template
2. **Build tool**: Add Eleventy/Astro/Vite + SSG that reads JSON → generates HTML on each deploy
3. **Netlify + Build plugin**: Netlify can run a build command on each CMS commit

---

## Recommended Next Step: Add a Build Step

Create `package.json`:
```json
{
  "scripts": {
    "build": "node build.js",
    "dev": "npx decap-server & python -m http.server 8080"
  },
  "devDependencies": {
    "decap-server": "^3.1.0"
  }
}
```

Create `build.js` that reads `content/site-content.json` + template → writes `index.html`.

Or use **Eleventy** (11ty):
```bash
npm init -y
npm install -D @11ty/eleventy
```

Then `npx eleventy` builds from templates + JSON data.

---

## Color Palette: Switch to MAKAAN WALEY Blue

In Admin → **Site Settings → Color Palette**, replace:

| Current (Amber) | New (Blue) |
|-----------------|------------|
| `#F97316` (500) | `#0D47A1` |
| `#EA580C` (600) | `#1565C0` |
| `#C2410C` (700) | `#1E3A8A` |
| `#0A0A0A` (dark) | `#0A0A0A` (keep) |
| `#111111` (dark100) | `#111111` (keep) |
| `#262626` (dark300) | `#262626` (keep) |

The CSS uses Tailwind's `amber-*` classes. After changing hex values in JSON, you'll need to either:
- **Option 1**: Update `css/sitee1de.css` custom properties (`--color-amber-500`, etc.) to match new hex
- **Option 2**: Add a build step that generates CSS variables from JSON

---

## Access Your Admin

Once OAuth is configured:
- **Local**: `http://localhost:8080/www.wehouse.in/admin/` (with `npx decap-server`)
- **Production**: `https://king6785.github.io/makaan-waley/admin/` (requires Netlify Git Gateway)

---

## Support

- Decap CMS docs: https://decapcms.org/docs/
- Netlify Identity: https://docs.netlify.com/visitor-access/identity/
- GitHub Pages: https://docs.github.com/en/pages