"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeader, clearToken } from "../../../../lib/auth.js";
import { API_BASE } from "../../../../lib/api.js";

const CLASS_NAMES = [
  "Healthy", "Helopeltis", "Not_Tea_Leaf", "Red_Spider", "Sunlight_Scorching", "Thrips",
];

export default function AdminHistory() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [classFilter, setClassFilter] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const load = () => {
    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (classFilter) params.append("class_filter", classFilter);
    fetch(`${API_BASE}/api/admin/history?${params}`, { headers: authHeader() })
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
  };

  useEffect(load, [page, classFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!confirm("Delete this prediction record?")) return;
    await fetch(`${API_BASE}/api/admin/history/${id}`, { method: "DELETE", headers: authHeader() });
    load();
  };

  if (error) return <p className="text-alert">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl text-ink">Prediction History</h1>
        <select
          value={classFilter}
          onChange={(e) => {
            setPage(1);
            setClassFilter(e.target.value);
          }}
          className="border border-ink/15 rounded-lg px-3 py-1.5 text-sm bg-white/70"
        >
          <option value="">All classes</option>
          {CLASS_NAMES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {!data && <p className="text-ink/50">Loading…</p>}

      {data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((r) => (
              <div key={r.id} className="bg-white/70 rounded-xl overflow-hidden border border-ink/10">
                <img src={`${API_BASE}/uploads/${r.image_path}`} alt="" className="w-full h-36 object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium text-ink">
                    {r.classes.join(" / ") || "Uncertain"}
                  </p>
                  <p className="text-xs text-ink/50 mt-0.5">{r.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-ink/40">{new Date(r.created_at).toLocaleString()}</p>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs text-alert hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.items.length === 0 && (
            <p className="text-sm text-ink/50 mt-4">No predictions match this filter.</p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm px-3 py-1.5 rounded border border-ink/15 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-ink/60">
              Page {data.page} · {data.total} total
            </span>
            <button
              disabled={page * data.page_size >= data.total}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm px-3 py-1.5 rounded border border-ink/15 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
