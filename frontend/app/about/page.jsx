"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import { API_BASE } from "../../lib/api.js";

function StatCard({ label, value }) {
  return (
    <div className="border border-ink/10 rounded-xl px-5 py-4 bg-white/60">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="text-xs uppercase tracking-wide text-ink/50 mt-1">{label}</p>
    </div>
  );
}

export default function About() {
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/model-stats`).then((r) => r.json()).then(setStats).catch(() => {});
    fetch(`${API_BASE}/api/classes`).then((r) => r.json()).then(setClasses).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-6 md:px-10 py-14 w-full">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber mb-3">
          Under the hood
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink">About the model</h1>
        <p className="text-ink/60 mt-4 max-w-2xl">
          A fine-tuned EfficientNetV2B0 classifies six categories, including three
          insect-damage types that look almost identical to the human eye. Instead
          of always forcing a single answer, the model can flag when it's genuinely
          torn between two diagnoses.
        </p>

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard label="Test accuracy" value={`${(stats.test_accuracy * 100).toFixed(2)}%`} />
              <StatCard label="Binary avg. accuracy" value={`${(stats.binary_avg_accuracy * 100).toFixed(2)}%`} />
              <StatCard label="Training images" value={stats.train_images.toLocaleString()} />
              <StatCard label="Test images" value={stats.test_images.toLocaleString()} />
            </div>

            <div className="mt-10">
              <h2 className="font-display text-xl text-ink mb-3">Per-class performance</h2>
              <div className="overflow-x-auto rounded-xl border border-ink/10">
                <table className="w-full text-sm">
                  <thead className="bg-ink text-cream/80 text-left">
                    <tr>
                      <th className="px-4 py-2.5 font-normal">Class</th>
                      <th className="px-4 py-2.5 font-normal">Precision</th>
                      <th className="px-4 py-2.5 font-normal">Recall</th>
                      <th className="px-4 py-2.5 font-normal">F1</th>
                      <th className="px-4 py-2.5 font-normal">Binary acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.per_class).map(([cls, v], i) => (
                      <tr key={cls} className={i % 2 ? "bg-white/40" : "bg-white/70"}>
                        <td className="px-4 py-2.5">{cls.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2.5 font-mono">{v.precision.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono">{v.recall.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono">{v.f1.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono">{(v.binary_acc * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-display text-xl text-ink mb-3">
                How the smart-prediction layer decides
              </h2>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="border border-ink/10 rounded-xl p-4 bg-white/60">
                  <p className="font-semibold text-tea">High confidence</p>
                  <p className="text-ink/60 mt-1">
                    Top score ≥ {stats.thresholds.high_conf_threshold * 100}% → return it directly.
                  </p>
                </div>
                <div className="border border-ink/10 rounded-xl p-4 bg-white/60">
                  <p className="font-semibold text-alert">Ambiguous / dual</p>
                  <p className="text-ink/60 mt-1">
                    Gap between top two &lt; {stats.thresholds.delta_threshold * 100}% and both from the
                    confused trio (Red Spider, Thrips, Helopeltis) → show both.
                  </p>
                </div>
                <div className="border border-ink/10 rounded-xl p-4 bg-white/60">
                  <p className="font-semibold text-amber">Best guess / uncertain</p>
                  <p className="text-ink/60 mt-1">
                    Otherwise return the top class if it clears {stats.thresholds.base_threshold * 100}%,
                    or say the image is inconclusive.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {classes.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-ink mb-3">Disease reference</h2>
            <div className="space-y-3">
              {classes.map((c) => (
                <details key={c.class_name} className="border border-ink/10 rounded-xl bg-white/60 px-4 py-3">
                  <summary className="cursor-pointer font-medium text-ink">{c.display_name}</summary>
                  <p className="text-sm text-ink/60 mt-2">{c.description}</p>
                  <p className="text-sm text-ink/60 mt-1">
                    <span className="font-medium text-ink/80">Symptoms: </span>
                    {c.symptoms}
                  </p>
                  <p className="text-sm text-ink/60 mt-1">
                    <span className="font-medium text-ink/80">Suggested action: </span>
                    {c.treatment}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
