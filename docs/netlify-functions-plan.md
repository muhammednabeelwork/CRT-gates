# Netlify Functions + Cloudflare R2 Plan

Goal: Host the frontend on Netlify and implement backend APIs as Netlify Functions. Store uploaded images in Cloudflare R2 and keep application state in a persistent DB (recommended: Supabase). Replace SSE with polling or a managed real-time service.

Architecture
- Netlify: serves static `dist` files and handles serverless functions in `netlify/functions`.
- Cloudflare R2: object storage for image uploads (S3-compatible API).
- Persistent state DB: use Supabase (free tier) or Firebase/PlanetScale to store `state` (images array, current index, timestamps).
- Real-time: SSE requires a long-running connection — serverless functions do not support persistent SSE. Options:
  - Polling: controllers poll `/api/state` every 1–3s (simplest).
  - Managed real-time service: Pusher, Ably, or Supabase Realtime for real-time updates.

Environment variables to configure in Netlify
- `SUPABASE_URL` and `SUPABASE_KEY` (if using Supabase)
- `R2_ENDPOINT` (your R2 S3 endpoint) or `R2_ACCOUNT_BUCKET_URL`
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` (for S3-compatible SDK)

Implementation steps
1. Create a persistent table in Supabase: `state` with columns `id`, `data` (JSON), `updated_at`.
2. Implement `getState` to read `state` row and return JSON.
3. Implement `setIndex`, `reorder`, `deleteImage` to update the row in Supabase and return the new state.
4. Implement `upload` to accept base64, write binary to Cloudflare R2 (S3 API), generate a public URL, then insert the new image metadata into Supabase and return state.
5. Replace SSE by either:
   - Adding a short polling loop in the client (every 1–2s), or
   - Integrating Supabase Realtime (or Pusher) to push changes to clients.

Security & CORS
- Use Netlify environment variables for keys.
- Configure CORS on functions if necessary; Netlify Functions run on the same origin as the site by default.

Cost & free‑tier notes
- Netlify Functions: free tier includes limited build minutes and invocation limits — fine for low traffic/dev use.
- Cloudflare R2: free ingress/egress quotas; charges may apply for bandwidth/storage beyond free limits.
- Supabase: free tier provides generous limits for small apps.

Next steps (scaffolded in repo)
- `netlify/functions/*.js` skeletons were added — implement persistent DB calls and R2 upload logic.
- Update client to call function endpoints instead of `/api/*` paths (e.g., `/ .netlify/functions/getState`).

If you want, I can:
- Implement one function (e.g., `upload`) wired to Cloudflare R2 using the AWS S3 SDK and a Supabase example, then update the client fetch code and provide env var examples.
- Or create a polling client example that replaces SSE with a simple polling loop.
