"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeader, clearToken } from "../../../lib/auth.js";
import { API_BASE } from "../../../lib/api.js";

function Card({ label, value }) {
  return (
    <div className="bg-white/70 rounded-xl px-5 py-4">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/dashboard`, { headers: authHeader() })
      .then((r) => {
        if (r.status === 401) {
          clearToken();
          router.replace("/admin/login");
          throw new Error("Session expired");
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [router]);

  if (error) return <p className="text-alert">{error}</p>;
  if (!data) return <p className="text-ink/50">Loading dashboard…</p>;

  const maxClassCount = Math.max(1, ...Object.values(data.by_class));

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card label="Total predictions" value={data.total_predictions} />
        <Card label="High confidence" value={data.by_mode.high_confidence ?? 0} />
        <Card label="Ambiguous (dual)" value={data.by_mode.dual ?? 0} />
        <Card label="Uncertain" value={data.by_mode.uncertain ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Predictions by class</h2>
          <div className="space-y-2">
            {Object.entries(data.by_class).map(([cls, count]) => (
              <div key={cls} className="flex items-center gap-3">
                <span className="w-36 text-sm text-ink/70 shrink-0">{cls.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2.5 bg-ink/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tea rounded-full"
                    style={{ width: `${(count / maxClassCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs text-ink/60">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-3">Recent predictions</h2>
          <div className="space-y-3">
            {data.recent.length === 0 && <p className="text-sm text-ink/50">No predictions yet.</p>}
            {data.recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white/60 rounded-lg px-3 py-2">
                <img
                  src={`${API_BASE}/uploads/${r.image_path}`}
                  alt=""
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">
                    {r.classes.join(" / ") || "Uncertain"}
                  </p>
                  <p className="text-xs text-ink/40">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
