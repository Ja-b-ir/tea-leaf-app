/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxies API calls + uploaded images to the FastAPI backend during
    // `next dev` / `next start`, so the frontend can just call "/api/..."
    // and "/uploads/..." with no CORS setup needed.
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
