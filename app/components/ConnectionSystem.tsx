import { useEffect, useState } from 'react';

export interface PortPosition {
  x: number;
  y: number;
}

export interface Connection {
  from: { component: string; port: string };
  to: { component: string; port: string };
  color?: string;
  animated?: boolean;
}

interface ConnectionSystemProps {
  connections: Connection[];
  portPositions: Map<string, PortPosition>;
}

export default function ConnectionSystem({ connections, portPositions }: ConnectionSystemProps) {
  const [, setUpdateKey] = useState(0);

  useEffect(() => {
    setUpdateKey((prev) => prev + 1);
  }, [portPositions]);

  const drawConnection = (conn: Connection, index: number) => {
    const fromKey = `${conn.from.component}.${conn.from.port}`;
    const toKey = `${conn.to.component}.${conn.to.port}`;

    const fromPos = portPositions.get(fromKey);
    const toPos = portPositions.get(toKey);

    if (!fromPos || !toPos) return null;

    const x1 = fromPos.x;
    const y1 = fromPos.y;
    const x2 = toPos.x;
    const y2 = toPos.y;

    const color = conn.color || '#6b7280';

    const dx = x2 - x1;
    const dy = y2 - y1;

    let path: string;

    if (Math.abs(dx) > 50) {
      const controlOffset = Math.abs(dx) * 0.5;
      path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
    } else if (dy > 20) {
      const midY = y1 + dy / 2;
      path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    } else if (dy < -20) {
      const offsetX = 30;
      const midX1 = x1 + offsetX;
      path = `M ${x1} ${y1} L ${midX1} ${y1} L ${midX1} ${y2} L ${x2} ${y2}`;
    } else {
      path = `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    return (
      <g key={`conn-${index}`}>
        <path
          d={path}
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        <path
          d={path}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        {conn.animated && (
          <circle r="3" fill={color}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-100">
      {connections.map((conn, idx) => drawConnection(conn, idx))}
    </svg>
  );
}
