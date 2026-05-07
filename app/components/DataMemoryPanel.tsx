import { useMemo, useState } from 'react';
import type { ProcessorState } from '../core/Processor';
import { REG_NAMES } from '../utils/instrFormat';

interface DataMemoryPanelProps {
  state: ProcessorState;
}

type Base = 'dec' | 'hex';

const MAX_REG_TAGS_PER_ROW = 3;

export default function DataMemoryPanel({ state }: DataMemoryPanelProps) {
  const [base, setBase] = useState<Base>('dec');

  const addrToRegs = useMemo(() => {
    const m = new Map<number, number[]>();
    for (let i = 1; i < 32; i++) {
      const addr = state.registers[i] >>> 0;
      if (!m.has(addr)) m.set(addr, []);
      m.get(addr)!.push(i);
    }
    return m;
  }, [state.registers]);

  const entries = Object.entries(state.dataMemoryContents)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([a], [b]) => a - b);

  const formatValue = (v: number) => {
    if (base === 'hex') {
      return '0x' + ((v >>> 0).toString(16).toUpperCase().padStart(8, '0'));
    }
    return (v | 0).toString();
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-md flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 border-b border-zinc-200 shrink-0 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider m-0">
          Data Memory
        </h3>
        <div className="flex items-center gap-0 rounded border border-zinc-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setBase('dec')}
            className={`px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer ${
              base === 'dec' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            DEC
          </button>
          <button
            type="button"
            onClick={() => setBase('hex')}
            className={`px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer ${
              base === 'hex' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            HEX
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {entries.length === 0 ? (
          <div className="text-center text-xs text-zinc-400 py-6">
            No data in memory
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-zinc-200">
                <th className="text-left py-1 px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Addr
                </th>
                <th className="text-left py-1 px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Refs
                </th>
                <th className="text-right py-1 px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([addr, val]) => {
                const isActive =
                  addr === state.dataMemory.address &&
                  (state.controlSignals.memRead === 1 || state.controlSignals.memWrite === 1);
                const regs = addrToRegs.get(addr >>> 0) ?? [];
                const visible = regs.slice(0, MAX_REG_TAGS_PER_ROW);
                const overflow = regs.length - visible.length;
                return (
                  <tr
                    key={addr}
                    className={`border-b border-zinc-100 ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <td className="py-1 px-2 font-mono text-[10px] text-zinc-600 align-middle">
                      0x{addr.toString(16).toUpperCase().padStart(4, '0')}
                    </td>
                    <td className="py-1 px-2 align-middle">
                      {regs.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {visible.map((r) => (
                            <span
                              key={r}
                              className="font-mono text-[9px] px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100"
                              title={`${REG_NAMES[r]} -> 0x${addr.toString(16).toUpperCase()}`}
                            >
                              {REG_NAMES[r]}
                            </span>
                          ))}
                          {overflow > 0 && (
                            <span className="font-mono text-[9px] px-1 rounded bg-zinc-100 text-zinc-500">
                              +{overflow}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-2 font-mono text-[10px] text-right font-semibold text-zinc-900 tabular-nums align-middle">
                      {formatValue(val)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
