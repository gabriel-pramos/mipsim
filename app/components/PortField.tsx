import { useEffect, useRef } from 'react';

interface PortFieldProps {
  id: string;
  componentId: string;
  type: 'input' | 'output';
  label: string;
  value?: string | number;
  onPortPosition?: (componentId: string, portId: string, x: number, y: number) => void;
}

export default function PortField({
  id,
  componentId,
  type,
  label,
  value,
  onPortPosition,
}: PortFieldProps) {
  const portRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (portRef.current && onPortPosition) {
      const updatePosition = () => {
        const rect = portRef.current?.getBoundingClientRect();
        const canvas = document.querySelector('[data-canvas]');

        if (rect && canvas) {
          const canvasRect = canvas.getBoundingClientRect();
          const x = rect.left - canvasRect.left + (type === 'output' ? rect.width : 0);
          const y = rect.top - canvasRect.top + rect.height / 2;
          onPortPosition(componentId, id, x, y);
        }
      };

      updatePosition();

      window.addEventListener('resize', updatePosition);

      const observer = new MutationObserver(updatePosition);
      const component = portRef.current.closest('[data-component-id]');
      if (component) {
        observer.observe(component, { attributes: true, attributeFilter: ['style'] });
      }

      return () => {
        window.removeEventListener('resize', updatePosition);
        observer.disconnect();
      };
    }
  }, [componentId, id, type, onPortPosition]);

  return (
    <div
      ref={portRef}
      data-port-id={id}
      data-port-type={type}
      className={`flex items-center gap-1 text-[10px] py-0.5 relative ${type === 'output' ? 'justify-end' : ''}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_0_1px_#3b82f6]" />
      <span className="text-zinc-500 font-medium">{label}</span>
      {value !== undefined && <span className="text-zinc-900 font-mono font-semibold truncate">{value}</span>}
    </div>
  );
}
