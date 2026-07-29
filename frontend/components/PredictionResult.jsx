"use client";

import { useId } from "react";

const CLASS_NAMES = [
  "Healthy",
  "Helopeltis",
  "Not_Tea_Leaf",
  "Red_Spider",
  "Sunlight_Scorching",
  "Thrips",
];

const MODE_META = {
  high_confidence: {
    label: "High confidence",
    badge: "bg-tea text-cream",
    barColor: "#2F5233",
  },
  dual: {
    label: "Ambiguous — two possible diseases",
    badge: "bg-alert text-cream",
    barColor: "#B3452C",
  },
  default: {
    label: "Best guess",
    badge: "bg-amber text-ink",
    barColor: "#C97A2B",
  },
  uncertain: {
    label: "Uncertain",
    badge: "bg-ink/10 text-ink",
    barColor: "#9CA3AF",
  },
};

/** Leaf-shaped confidence gauge — fills bottom-to-top with the score. */
function LeafGauge({ score = 0, color = "#2F5233", size = 72 }) {
  const clipId = useId();
  const fillHeight = 100 - Math.round(score * 100);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M50 6C24 12 8 34 8 56c0 22 18 38 42 38 10-28 22-42 42-56C74 12 60 6 50 6Z" />
        </clipPath>
      </defs>
      <path
        d="M50 6C24 12 8 34 8 56c0 22 18 38 42 38 10-28 22-42 42-56C74 12 60 6 50 6Z"
        fill="#EDE8DA"
        stroke="#16241C"
        strokeOpacity="0.15"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y={fillHeight} width="100" height={100 - fillHeight} fill={color} />
      </g>
      <path
        d="M50 10c-4 6-6 14-6 24"
        stroke="#16241C"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

export default function PredictionResult({ result }) {
  if (!result) return null;

  const meta = MODE_META[result.mode] ?? MODE_META.default;
  const probs = result.all_probs || {};
  const sortedClasses = [...CLASS_NAMES].sort((a, b) => (probs[b] ?? 0) - (probs[a] ?? 0));

  return (
    <div className="bg-white/70 border border-ink/10 rounded-2xl p-6 md:p-8">
      {/* Verdict header */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex -space-x-3">
          {result.classes.length > 0 ? (
            result.classes.map((c, i) => (
              <LeafGauge key={c} score={result.scores[i]} color={meta.barColor} size={64} />
            ))
          ) : (
            <LeafGauge score={0} color={meta.barColor} size={64} />
          )}
        </div>
        <div className="flex-1 min-w-[220px]">
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badge}`}>
            {meta.label}
          </span>
          <p className="font-display text-xl md:text-2xl mt-2 text-ink">
            {result.classes.length === 0
              ? "Couldn't confidently identify this leaf"
              : result.classes.join("  /  ")}
          </p>
          <p className="font-mono text-xs text-ink/60 mt-1">{result.message}</p>
        </div>
      </div>

      {/* Full probability breakdown */}
      <div className="mt-8 space-y-2.5">
        {sortedClasses.map((cls) => {
          const p = probs[cls] ?? 0;
          const isPicked = result.classes.includes(cls);
          return (
            <div key={cls} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-ink/80">{cls.replace(/_/g, " ")}</span>
              <div className="flex-1 h-2.5 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(p * 100, 1.5)}%`,
                    backgroundColor: isPicked ? meta.barColor : "#B8C4B4",
                  }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs text-ink/70">
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
