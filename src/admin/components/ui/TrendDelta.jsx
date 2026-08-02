import { ArrowUp, ArrowDown } from "lucide-react";

/* ========================================
   TREND DELTA
   Never color alone — always paired with
   an arrow icon and a text label.
========================================= */

function TrendDelta({ percent, label = "vs previous period" }) {
  if (percent === null || percent === undefined) {
    return null;
  }

  const isFlat = percent === 0;
  const isUp = percent > 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isFlat
          ? "text-muted"
          : isUp
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-500"
      }`}
    >
      {!isFlat &&
        (isUp ? (
          <ArrowUp size={12} strokeWidth={2.5} />
        ) : (
          <ArrowDown size={12} strokeWidth={2.5} />
        ))}
      {isFlat ? "No change" : `${Math.abs(percent)}%`}
      {label && <span className="text-muted font-normal">{label}</span>}
    </span>
  );
}

export default TrendDelta;
