import { useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import world from "world-atlas/countries-110m.json";

import { countryFlag, countryName, formatLocation, formatDuration, pageLabel } from "./visitorFormat";

/* ========================================
   WORLD MAP — countries shaded by sessions
   (sequential, one hue) with live visitors
   as pulsing dots. Hover for exact counts.
========================================= */

const WIDTH = 960;
const HEIGHT = 470;
const ANTARCTICA = "010";

const shapes = feature(world, world.objects.countries).features.filter((f) => f.id !== ANTARCTICA);

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "FeatureCollection", features: shapes });
const pathOf = geoPath(projection);

const SHAPES = shapes.map((shape) => ({
  code: shape.id ? countries.numericToAlpha2(shape.id) : undefined,
  name: shape.properties?.name,
  d: pathOf(shape),
}));

const STEPS = [0.2, 0.45, 0.7, 1];

function WorldMap({ countryCounts = [], live = [] }) {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);

  const counts = useMemo(
    () => new Map(countryCounts.filter((row) => row.label).map((row) => [row.label, row.count])),
    [countryCounts],
  );
  const total = countryCounts.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...counts.values());

  const fill = (count) =>
    count
      ? `color-mix(in srgb, var(--color-chart-1) ${Math.round(20 + (count / max) * 80)}%, var(--color-surface))`
      : "var(--color-surface)";

  const dots = live
    .map((session) => {
      const [lat, lng] = session.location?.ll || [];
      if (lat === undefined || lng === undefined) return null;
      const point = projection([lng, lat]);
      return point ? { session, x: point[0], y: point[1] } : null;
    })
    .filter(Boolean);

  const track = (event, content) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = event.clientX - box.left;
    setHover({ x, y: event.clientY - box.top, flip: x > box.width / 2, content });
  };

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Map of sessions by country">
          {SHAPES.map((shape, index) => {
            const count = (shape.code && counts.get(shape.code)) || 0;

            return (
              <path
                key={shape.code || `${shape.name}-${index}`}
                d={shape.d}
                fill={fill(count)}
                stroke="var(--color-border)"
                strokeWidth={0.5}
                className="transition-[filter] hover:brightness-90"
                onMouseMove={(event) =>
                  track(event, {
                    title: `${countryFlag(shape.code)} ${shape.code ? countryName(shape.code) : shape.name}`,
                    lines: [
                      count
                        ? `${count} session${count === 1 ? "" : "s"} · ${Math.round((count / total) * 1000) / 10}%`
                        : "No sessions",
                    ],
                  })
                }
              />
            );
          })}

          {dots.map(({ session, x, y }) => (
            <g
              key={session.sessionId}
              transform={`translate(${x} ${y})`}
              onMouseMove={(event) =>
                track(event, {
                  title: `🟢 ${formatLocation(session.location)}`,
                  lines: [
                    `${session.browser} · ${session.os} · on for ${formatDuration(session.durationMs)}`,
                    `Now on ${pageLabel(session.exitPage)}`,
                  ],
                })
              }
            >
              <circle r={14} fill="transparent" />
              <circle r={9} className="fill-emerald-500/30 animate-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              <circle r={4.5} className="fill-emerald-500" stroke="var(--color-card)" strokeWidth={2} />
            </g>
          ))}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl border border-border bg-[var(--color-card)] px-3 py-2 shadow-lg text-xs space-y-0.5 whitespace-nowrap"
            style={{
              left: hover.x,
              top: hover.y,
              transform: `translate(${hover.flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
            }}
          >
            <p className="font-medium">{hover.content.title}</p>
            {hover.content.lines.map((line) => (
              <p key={line} className="text-muted">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live now ({dots.length}
          {live.length > dots.length ? ` of ${live.length} with coordinates` : ""})
        </span>

        <span className="inline-flex items-center gap-2">
          Fewer
          {STEPS.map((step) => (
            <span
              key={step}
              className="h-3 w-3 rounded-[3px]"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-chart-1) ${Math.round(20 + step * 80)}%, var(--color-surface))`,
              }}
            />
          ))}
          More sessions
        </span>
      </div>
    </div>
  );
}

export default WorldMap;
