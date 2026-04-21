import { useState, useRef, useEffect } from 'react';

interface ComponentViewProps {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  width?: number;
  onPositionChange?: (id: string, x: number, y: number) => void;
  children: React.ReactNode;
}

export default function ComponentView({
  id,
  title,
  color,
  x,
  y,
  width = 180,
  onPositionChange,
  children,
}: ComponentViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const componentRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.component-header')) {
      setIsDragging(true);
      const rect = componentRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (componentRef.current && onPositionChange) {
        const canvas = componentRef.current.parentElement;
        if (canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const newX = e.clientX - canvasRect.left - dragOffset.x;
          const newY = e.clientY - canvasRect.top - dragOffset.y;
          onPositionChange(id, Math.max(0, newX), Math.max(0, newY));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onPositionChange]);

  return (
    <div
      ref={componentRef}
      data-component-id={id}
      className={`absolute border border-zinc-200 rounded bg-white shadow-sm font-sans select-none ${isDragging ? 'cursor-grabbing z-1000' : 'cursor-default z-1'}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        borderTopColor: color,
        borderTopWidth: '2px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="component-header px-2 py-1 border-b border-zinc-100 cursor-grab bg-white rounded-t flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <h3 className="m-0 text-zinc-700 text-[11px] font-semibold truncate">
          {title}
        </h3>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
