# Deployment

The frontend is a static Vite build hosted on **Vercel**, served at [suryanshuverma.com.np](https://suryanshuverma.com.np). It talks to the backend API on Render.

---

## 1. Import the project into Vercel

1. *Add New → Project* → import this repository.
2. Vercel auto-detects Vite. Confirm:

   | Setting | Value |
   | --- | --- |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Output directory | `dist` |
   | Install command | `npm install` |

3. *Environment Variables* → add `VITE_GOOGLE_CLIENT_ID`.
4. Deploy.

`vercel.json` already rewrites all routes to `index.html`, so client-side routes such as `/blog/my-post` or `/dashboard/settings` work on direct load and refresh.

---

## 2. Custom domain

1. Vercel → *Settings → Domains* → add the apex domain and `www`.
2. Create the DNS records Vercel shows at your DNS provider.

---

## 3. Connect to the backend

| Where | What to set |
| --- | --- |
| `src/lib/axios.js` | `baseURL` → your API URL + `/api/v1` |
| Backend `src/app.js` | Add your frontend origin to the CORS list |
| Backend `src/modules/passkey/passkey.service.js` | Add your frontend origin to `ALLOWED_ORIGINS` |
| Backend env | `FRONTEND_URL=https://your-domain`, `WEBAUTHN_RP_ID=your-domain` |

Auth cookies are cross-site (`SameSite=None; Secure`), so the backend must run over HTTPS in production.

---

## 4. Google Sign-In

In Google Cloud Console → *Credentials* → your OAuth Web client, add every origin the app runs on under **Authorized JavaScript origins**:

```
http://localhost:5173
https://your-domain
https://www.your-domain
```

Use the same client ID for `VITE_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` (backend).

---

## 5. Verify the deployment

- [ ] Home page loads and all sections render data.
- [ ] Refreshing `/blog` or `/projects/<slug>` doesn't 404.
- [ ] Theme toggle persists across reloads.
- [ ] Contact form submits successfully.
- [ ] Google and passkey login work on the production domain.
- [ ] An admin account reaches `/dashboard`.
- [ ] `/verify` shows on-chain data.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| 404 on refresh of a nested route | `vercel.json` rewrite missing or not deployed. |
| CORS error in console | Frontend origin not in the backend CORS list. |
| Logged in, but immediately logged out / `401`s | Cookies blocked — backend not on HTTPS, or `NODE_ENV` not `production` on the backend. |
| Google button shows "origin not allowed" | Domain missing from *Authorized JavaScript origins*. |
| Passkey prompt fails | `WEBAUTHN_RP_ID` / `ALLOWED_ORIGINS` on the backend don't match this domain. |
| First load is slow | Backend cold start on Render's free tier. |
| `VITE_GOOGLE_CLIENT_ID` is `undefined` | Variable not set in Vercel, or set after the last build — redeploy. |
