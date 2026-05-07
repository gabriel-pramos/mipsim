import { useEffect, useState } from 'react';

export interface PortPosition {
  x: number;
  y: number;
}

export interface Connection {
  from: { component: string; port: string };
  to: { component: string; port: string };
  color?: string;
}

interface ConnectionSystemProps {
  connections: Connection[];
  portPositions: Map<string, PortPosition>;
}

interface Rect { x: number; y: number; w: number; h: number; }
interface Pt { x: number; y: number; }

/** How far the wire stub extends straight out of the source/target before bending. */
const STUB = 14;
/** Padding around obstacles so wires don't graze component borders. */
const INFLATE = 6;
/** Corner rounding radius for orthogonal bends. */
const CORNER = 6;

function inflate(r: Rect, pad: number): Rect {
  return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
}

/**
 * True when an axis-aligned segment crosses or grazes the rectangle's interior.
 * Endpoints exactly on the border are treated as a hit (caller is expected to
 * pre-exclude the source and target rectangles for the connection).
 */
function segHitsRect(p1: Pt, p2: Pt, r: Rect): boolean {
  const xMin = Math.min(p1.x, p2.x);
  const xMax = Math.max(p1.x, p2.x);
  const yMin = Math.min(p1.y, p2.y);
  const yMax = Math.max(p1.y, p2.y);
  if (xMax < r.x || xMin > r.x + r.w) return false;
  if (yMax < r.y || yMin > r.y + r.h) return false;
  return true;
}

function pathHitsAny(pts: Pt[], rects: Rect[]): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const r of rects) {
      if (segHitsRect(pts[i], pts[i + 1], r)) return true;
    }
  }
  return false;
}

/**
 * Convert a sequence of orthogonal points into a path string with rounded
 * corners at each interior bend. Adjacent equal points are skipped.
 */
function pointsToRoundedPath(rawPts: Pt[]): string {
  const pts: Pt[] = [];
  for (const p of rawPts) {
    const last = pts[pts.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) pts.push(p);
  }
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(CORNER, lenIn / 2, lenOut / 2);
    if (r < 0.5) {
      d += ` L ${cur.x} ${cur.y}`;
      continue;
    }
    const dirInX = (cur.x - prev.x) / (lenIn || 1);
    const dirInY = (cur.y - prev.y) / (lenIn || 1);
    const dirOutX = (next.x - cur.x) / (lenOut || 1);
    const dirOutY = (next.y - cur.y) / (lenOut || 1);
    const ax = cur.x - dirInX * r;
    const ay = cur.y - dirInY * r;
    const bx = cur.x + dirOutX * r;
    const by = cur.y + dirOutY * r;
    d += ` L ${ax} ${ay} Q ${cur.x} ${cur.y} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Discover a small set of horizontal and vertical "corridors" — coordinates
 * where a long axis-parallel segment can travel without intersecting any
 * inflated obstacle. Returns midpoints of free intervals plus a sentinel
 * above/below (or left/right) of everything.
 */
function corridors(allBounds: Rect[]): { ys: number[]; xs: number[] } {
  if (allBounds.length === 0) return { ys: [], xs: [] };

  const inflated = allBounds.map((b) => inflate(b, INFLATE));

  const yEdges = new Set<number>();
  const xEdges = new Set<number>();
  for (const r of inflated) {
    yEdges.add(r.y);
    yEdges.add(r.y + r.h);
    xEdges.add(r.x);
    xEdges.add(r.x + r.w);
  }
  const ySorted = [...yEdges].sort((a, b) => a - b);
  const xSorted = [...xEdges].sort((a, b) => a - b);

  const yCorridors: number[] = [];
  for (let i = 0; i < ySorted.length - 1; i++) {
    const a = ySorted[i];
    const b = ySorted[i + 1];
    if (b - a < 8) continue;
    const mid = (a + b) / 2;
    const blocked = inflated.some((r) => r.y < mid && mid < r.y + r.h);
    if (!blocked) yCorridors.push(mid);
  }
  yCorridors.push(Math.min(...inflated.map((r) => r.y)) - 20);
  yCorridors.push(Math.max(...inflated.map((r) => r.y + r.h)) + 20);

  const xCorridors: number[] = [];
  for (let i = 0; i < xSorted.length - 1; i++) {
    const a = xSorted[i];
    const b = xSorted[i + 1];
    if (b - a < 8) continue;
    const mid = (a + b) / 2;
    const blocked = inflated.some((r) => r.x < mid && mid < r.x + r.w);
    if (!blocked) xCorridors.push(mid);
  }
  xCorridors.push(Math.min(...inflated.map((r) => r.x)) - 20);
  xCorridors.push(Math.max(...inflated.map((r) => r.x + r.w)) + 20);

  return { ys: yCorridors, xs: xCorridors };
}

function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
  }
  return len;
}

/**
 * Build an orthogonal path from `from` to `to`, exiting the source rightward
 * and entering the target leftward, picking the shortest candidate that
 * doesn't intersect any other component rectangle.
 */
function routeOrthogonal(
  from: Pt,
  to: Pt,
  fromBounds: Rect | undefined,
  toBounds: Rect | undefined,
  allBounds: Rect[],
): string {
  const obstacles = allBounds
    .filter((b) => b !== fromBounds && b !== toBounds)
    .map((b) => inflate(b, INFLATE));

  const s: Pt = { x: from.x + STUB, y: from.y };
  const t: Pt = { x: to.x - STUB, y: to.y };

  const cands: Pt[][] = [];

  // Direct H-V-H with the geometric mid X.
  const midX = (s.x + t.x) / 2;
  cands.push([from, s, { x: midX, y: s.y }, { x: midX, y: t.y }, t, to]);

  // V-H-V with geometric mid Y.
  const midY = (s.y + t.y) / 2;
  cands.push([from, s, { x: s.x, y: midY }, { x: t.x, y: midY }, t, to]);

  // Pure L-shapes.
  cands.push([from, s, { x: s.x, y: t.y }, t, to]);
  cands.push([from, s, { x: t.x, y: s.y }, t, to]);

  // Detours through every horizontal corridor (going up or down to lane Y).
  const { ys, xs } = corridors(allBounds);
  for (const laneY of ys) {
    cands.push([from, s, { x: s.x, y: laneY }, { x: t.x, y: laneY }, t, to]);
  }
  // Detours through every vertical corridor (e.g. for backwards-flow wires).
  for (const laneX of xs) {
    cands.push([from, s, { x: laneX, y: s.y }, { x: laneX, y: t.y }, t, to]);
  }
  // Compound detours: lane Y combined with lane X for hard backward wires.
  for (const laneY of ys) {
    for (const laneX of xs) {
      cands.push([
        from,
        s,
        { x: s.x, y: laneY },
        { x: laneX, y: laneY },
        { x: laneX, y: t.y },
        t,
        to,
      ]);
    }
  }

  let best: Pt[] | null = null;
  let bestLen = Infinity;
  for (const c of cands) {
    if (pathHitsAny(c, obstacles)) continue;
    const len = pathLength(c);
    if (len < bestLen) {
      bestLen = len;
      best = c;
    }
  }

  if (!best) best = cands[0];
  return pointsToRoundedPath(best);
}

export default function ConnectionSystem({ connections, portPositions }: ConnectionSystemProps) {
  const [bounds, setBounds] = useState<Map<string, Rect>>(() => new Map());

  useEffect(() => {
    const canvas = document.querySelector('[data-canvas]');
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const next = new Map<string, Rect>();
    canvas.querySelectorAll('[data-component-id]').forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const id = el.getAttribute('data-component-id');
      if (!id) return;
      next.set(id, {
        x: r.left - canvasRect.left,
        y: r.top - canvasRect.top,
        w: r.width,
        h: r.height,
      });
    });
    setBounds((prev) => {
      if (prev.size !== next.size) return next;
      for (const [k, v] of next) {
        const p = prev.get(k);
        if (!p || p.x !== v.x || p.y !== v.y || p.w !== v.w || p.h !== v.h) return next;
      }
      return prev;
    });
  }, [portPositions]);

  const allBounds = Array.from(bounds.values());

  const drawConnection = (conn: Connection, index: number) => {
    const fromKey = `${conn.from.component}.${conn.from.port}`;
    const toKey = `${conn.to.component}.${conn.to.port}`;

    const fromPos = portPositions.get(fromKey);
    const toPos = portPositions.get(toKey);

    if (!fromPos || !toPos) return null;

    const path = routeOrthogonal(
      fromPos,
      toPos,
      bounds.get(conn.from.component),
      bounds.get(conn.to.component),
      allBounds,
    );

    const color = conn.color || '#6b7280';

    return (
      <g key={`conn-${index}`}>
        <path
          d={path}
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
        <path
          d={path}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      </g>
    );
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-100"
      overflow="visible"
    >
      {connections.map((conn, idx) => drawConnection(conn, idx))}
    </svg>
  );
}
