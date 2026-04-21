import { useState, useRef } from 'react';
import type { ProcessorState } from '../core/Processor';

interface ProcessorTerminalProps {
  output: string;
  exception: ProcessorState['exception'];
  cop0: ProcessorState['cop0'];
  onSubmitLine: (line: string) => void;
}

export default function ProcessorTerminal({
  output,
  exception,
  cop0,
  onSubmitLine,
}: ProcessorTerminalProps) {
  const [line, setLine] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
      <div className="px-3 py-1 border-b border-zinc-200 flex flex-wrap items-center gap-x-4 gap-y-0.5">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider m-0">
          MMIO Terminal
        </h3>
        <span className="font-mono text-[11px] text-zinc-400">
          EPC 0x{exception.epc.toString(16)} EXL {exception.exl ? '1' : '0'} IRQ{' '}
          {exception.interruptPending ? 'pend' : '—'}
        </span>
        <span className="font-mono text-[11px] text-zinc-400">
          KBD IE {exception.keyboardInterruptEnable ? 'on' : 'off'} · master IE{' '}
          {exception.masterInterruptEnable ? 'on' : 'off'}
        </span>
        <span className="font-mono text-[11px] text-zinc-400">
          CP0 St 0x{cop0.status.toString(16)} Ca 0x{cop0.cause.toString(16)} ·{' '}
          {cop0.userMode ? 'user' : 'kernel'}
        </span>
      </div>

      <div
        className="h-24 overflow-y-auto px-3 py-1.5 bg-zinc-950 text-zinc-100 font-mono text-xs whitespace-pre-wrap wrap-break-word"
        aria-live="polite"
      >
        {output.length === 0 ? (
          <span className="text-zinc-600">
            Display output (0xFFFF000C) appears here...
          </span>
        ) : (
          output
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t border-zinc-200 px-2 py-1.5 bg-zinc-50"
        onSubmit={(e) => {
          e.preventDefault();
          const t = line;
          setLine('');
          onSubmitLine(t.endsWith('\n') ? t : `${t}\n`);
        }}
      >
        <input
          type="text"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="Type and Enter — sent to keyboard MMIO (0xFFFF0004)"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-md border border-zinc-300 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-zinc-900 text-white text-sm font-medium border border-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
