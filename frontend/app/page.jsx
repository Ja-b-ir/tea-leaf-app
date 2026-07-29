"use client";

import { useState, useRef, useCallback } from "react";
import Navbar from "../components/Navbar.jsx";
import PredictionResult from "../components/PredictionResult.jsx";
import { API_BASE } from "../lib/api.js";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/predict`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Prediction failed. Please try again.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        {/* Hero */}
        <section className="bg-ink text-cream">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber mb-4">
                Deep learning · tea leaf diagnosis
              </p>
              <h1 className="font-display text-4xl md:text-5xl leading-tight">
                Point a camera at a tea leaf.
                <br />
                Know the disease in seconds.
              </h1>
              <p className="mt-5 text-cream/70 max-w-md">
                Upload a photo and our model — trained on over 18,000 field images —
                tells you what's affecting the leaf. When two diseases look too
                similar to call, it says so instead of guessing.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-3 gap-3">
                {["Healthy", "Helopeltis", "Red Spider", "Thrips", "Sunlight Scorch", "Not a Leaf"].map(
                  (label) => (
                    <div
                      key={label}
                      className="border border-cream/15 rounded-xl px-3 py-4 text-center text-xs text-cream/60"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Upload + result */}
        <section className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
          {!preview && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${
                dragActive ? "border-amber bg-amber/5" : "border-ink/20 hover:border-ink/40"
              }`}
            >
              <p className="font-display text-xl text-ink">Drop a tea leaf photo here</p>
              <p className="text-sm text-ink/50 mt-2">or click to choose a file — JPG or PNG</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {preview && (
            <div className="space-y-6">
              <div className="flex gap-6 items-start flex-wrap">
                <img
                  src={preview}
                  alt="Selected tea leaf"
                  className="w-40 h-40 object-cover rounded-xl border border-ink/10"
                />
                <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="bg-tea text-cream rounded-lg px-5 py-2.5 font-medium hover:bg-tea-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? "Analysing…" : "Diagnose this leaf"}
                  </button>
                  <button
                    onClick={reset}
                    className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 text-left"
                  >
                    Choose a different photo
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-alert/30 bg-alert/5 px-4 py-3 text-sm text-alert">
                  {error}
                </div>
              )}

              {result && <PredictionResult result={result} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
