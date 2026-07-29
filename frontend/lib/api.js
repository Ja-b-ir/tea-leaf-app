// Base URL of the backend API.
//
// LOCAL DEV: leave NEXT_PUBLIC_API_URL unset. Calls go to relative paths
// like "/api/predict", which next.config.mjs rewrites to localhost:8000.
//
// DEPLOYED (e.g. frontend on Vercel, backend on Hugging Face Spaces):
// set NEXT_PUBLIC_API_URL to your backend's public URL, e.g.
//   https://your-username-tea-leaf-backend.hf.space
// (no trailing slash). All API calls below will then go straight to it.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
