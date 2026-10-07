# Frontend Architecture

How the app is put together, and the conventions to follow when extending it.

- [Application shell](#application-shell)
- [Routing](#routing)
- [Data layer](#data-layer)
- [Authentication](#authentication)
- [Admin dashboard](#admin-dashboard)
- [Theming & design tokens](#theming--design-tokens)
- [SEO](#seo)
- [Analytics](#analytics)
- [Blockchain verification](#blockchain-verification)
- [Adding a new content section](#adding-a-new-content-section)

---

## Application shell

`src/main.jsx` composes the providers, outermost first:

```
<StrictMode>
  <GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>
    <HelmetProvider>              ← per-page <head> tags
      <BrowserRouter>
        <AuthProvider>            ← session state
          <App />
          <ToastContainer />      ← global notifications
```

`App.jsx` then:

1. Shows the `InitialLoader` for ~1.2 s on first load and waits for `AuthContext` to finish restoring the session, so protected pages never flash a logged-out state.
2. Fetches public settings to learn whether **maintenance mode** is on.
3. Renders routes inside `AnimatePresence` with a `PageTransition` wrapper for animated navigation.
4. `ScrollToHash` scrolls to in-page anchors (`/#projects`) after navigation.

---

## Routing

| Group | Guard | Notes |
| --- | --- | --- |
| Public pages (`/`, `/projects/:slug`, `/blog`, `/blog/:slug`) | `PublicGate` | Replaced by `MaintenanceScreen` when `maintenanceMode` is on. |
| Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/link-passkey/:token`, `/account`), `/verify` | none | Always reachable — the admin can sign in during maintenance. |
| `/dashboard/*` | `ProtectedRoute` | No user → `/login`. Non-admin → `/account`. Nested routes render inside `AdminLayout` via `<Outlet>`. |

`vercel.json` rewrites every request to `index.html` so deep links work on refresh.

---

## Data layer

```
Component ──► service function ──► lib/axios.js ──► Backend API
```

- **`src/lib/axios.js`** — single Axios instance with the API `baseURL`, `withCredentials: true` (sends the auth cookies) and a response interceptor hook.
- **`src/services/public.*.service.js`** — read-only calls used by the public site (`/…/public` endpoints).
- **`src/admin/services/*.service.js`** — authenticated CRUD calls used by the dashboard.

There is one service file per backend module. Components never import Axios directly; this keeps endpoints in one place and makes the API surface easy to audit.

Responses follow the backend envelope `{ success, message, data }`; services generally return `response.data.data`.

---

## Authentication

`src/contexts/AuthContext.jsx` owns the session.

| Action | Backend call(s) |
| --- | --- |
| Restore session on load | `GET /auth/me` |
| Password login / register | `POST /auth/login`, `POST /auth/register` |
| Google | `@react-oauth/google` returns an ID token → `POST /google-auth/login` |
| Passkey login | `POST /passkey/authentication/options` → `startAuthentication()` → `/authentication/verify` |
| Passkey sign-up | `POST /passkey/signup/options` → `startRegistration()` → `/signup/verify` |
| Add this device | `POST /passkey/link/request` (email) → user opens `/link-passkey/:token` → `/link/options` → `startRegistration()` → `/link/verify` |
| Logout | `POST /auth/logout` |

Tokens are `httpOnly` cookies set by the server — the frontend never reads or stores them. The context only holds the `user` object (`email`, `role`, …), which `ProtectedRoute` uses for role checks.

Auth forms use **React Hook Form** with **Zod** schemas from `src/validations/authValidation.jsx`.

---

## Admin dashboard

```
AdminLayout
├── Sidebar   ← driven by admin/constants/sidebarLinks.js (MAIN / SYSTEM sections)
├── Header
└── <Outlet>  ← admin/pages/*
```

Reusable building blocks in `src/admin/components/`:

| Component | Purpose |
| --- | --- |
| `form/AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminSwitch` | Consistent form controls |
| `form/TechnologyInput`, `RoleInput` | Tag-style list inputs |
| `upload/ImageUploader`, `GalleryUploader` | Upload to `/upload/image(s)`, return `{ publicId, url }` |
| `blog/MarkdownEditor` | Write/preview Markdown editor |
| `ui/ConfirmModal` | Confirmation before destructive actions |
| `StatCard`, `ui/TrendDelta` | Dashboard KPIs with period-over-period change |

Charts on the Dashboard and Analytics pages use **Recharts**.

---

## Theming & design tokens

- **Tokens** are declared once in `src/styles/globals.css` inside Tailwind 4's `@theme` block (`--color-background`, `--color-surface`, `--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, `--color-border`, chart colours, …) and overridden for `.dark`.
- Components use the semantic utilities these generate (`bg-background`, `text-primary`, `border-border`) rather than raw colours, so both themes stay in sync.
- **No flash of wrong theme:** an inline script in `index.html` reads `localStorage.theme` (falling back to `prefers-color-scheme`) and sets the `dark` class and background colour *before* React loads.
- `ThemeToggle` flips the class and persists the choice.

---

## SEO

`components/common/SEO.jsx` wraps `react-helmet-async` and sets title, description, keywords and Open Graph image per page. The home page reads `siteTitle`, `siteDescription`, `siteKeywords` and `ogImage` from the admin-managed Settings, with sensible defaults. `public/robots.txt` allows all crawlers and points at the sitemap.

---

## Analytics

- `lib/visitorId.js` generates a random UUID on first visit and keeps it in `localStorage` — no cookies, no personal data.
- Pages call `trackPageView(path)` from `services/public.analytics.service.js`, which posts `{ path, referrer, visitorId }` to `/analytics/track`.
- Device, browser, OS and country are derived on the server from the request, not collected in the browser.

---

## Blockchain verification

`/verify` and `BlockchainModal` read a smart contract deployed on **Polygon Amoy** (testnet) using an ethers.js `JsonRpcProvider` — no wallet required.

| | |
| --- | --- |
| Contract address | `src/blockchain/contract.js` → `CONTRACT_ADDRESS` |
| ABI (read-only) | `developerName()`, `portfolioTitle()`, `github()`, `portfolioUrl()`, `deployedAt()`, `owner()` |
| RPC | `https://rpc-amoy.polygon.technology` |

The page shows the on-chain values, owner address and a link to PolygonScan as proof of authorship.

---

## Adding a new content section

1. **Backend** — add a module (model, validation, service, controller, routes) with `/public` and admin CRUD endpoints. See the backend's `docs/ARCHITECTURE.md`.
2. **Public service** — `src/services/public.<name>.service.js` calling `GET /<name>/public`.
3. **Admin service** — `src/admin/services/<name>.service.js` with get/create/update/delete.
4. **Admin page** — `src/admin/pages/<Name>.jsx` using the shared form and upload components.
5. **Register it** — add the route under `/dashboard` in `App.jsx` and a link in `admin/constants/sidebarLinks.js`.
6. **Public section** — `src/components/sections/<Name>/<Name>.jsx`, rendered from `pages/HomePage.jsx`, with a skeleton loading state.
