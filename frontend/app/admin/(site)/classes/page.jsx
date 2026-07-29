"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeader, clearToken } from "../../../../lib/auth.js";
import { API_BASE } from "../../../../lib/api.js";

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [editing, setEditing] = useState(null); // class_name being edited
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const load = () => {
    fetch(`${API_BASE}/api/admin/classes`, { headers: authHeader() })
      .then((r) => {
        if (r.status === 401) {
          clearToken();
          router.replace("/admin/login");
          throw new Error("Session expired");
        }
        return r.json();
      })
      .then(setClasses)
      .catch(() => {});
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (c) => {
    setEditing(c.class_name);
    setDraft({ ...c });
  };

  const save = async () => {
    setSaving(true);
    await fetch(`${API_BASE}/api/admin/classes/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">Disease Classes</h1>
      <p className="text-sm text-ink/50 mb-6">
        Edit the descriptions, symptoms, and suggested actions shown to users on the
        client site's About page.
      </p>

      <div className="space-y-4">
        {classes.map((c) => (
          <div key={c.class_name} className="bg-white/70 border border-ink/10 rounded-xl p-5">
            {editing === c.class_name ? (
              <div className="space-y-3">
                <input
                  className="w-full border border-ink/15 rounded-lg px-3 py-2 bg-white font-medium"
                  value={draft.display_name}
                  onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                />
                <textarea
                  className="w-full border border-ink/15 rounded-lg px-3 py-2 bg-white text-sm"
                  rows={2}
                  placeholder="Description"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
                <textarea
                  className="w-full border border-ink/15 rounded-lg px-3 py-2 bg-white text-sm"
                  rows={2}
                  placeholder="Symptoms"
                  value={draft.symptoms}
                  onChange={(e) => setDraft({ ...draft, symptoms: e.target.value })}
                />
                <textarea
                  className="w-full border border-ink/15 rounded-lg px-3 py-2 bg-white text-sm"
                  rows={2}
                  placeholder="Suggested action"
                  value={draft.treatment}
                  onChange={(e) => setDraft({ ...draft, treatment: e.target.value })}
                />
                <div className="flex gap-3">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="bg-tea text-cream rounded-lg px-4 py-1.5 text-sm hover:bg-tea-dark disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-sm text-ink/60 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{c.display_name}</p>
                  <p className="text-sm text-ink/60 mt-1">{c.description}</p>
                  <p className="text-xs text-ink/50 mt-1">
                    <span className="font-medium">Symptoms:</span> {c.symptoms}
                  </p>
                  <p className="text-xs text-ink/50 mt-1">
                    <span className="font-medium">Action:</span> {c.treatment}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(c)}
                  className="text-sm text-amber hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
