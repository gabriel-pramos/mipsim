import { useState } from 'react';
import type { ProcessorState } from '../core/Processor';
import { REG_NAMES } from '../utils/instrFormat';

interface RegistersPanelProps {
  state: ProcessorState;
  prevRegisters: number[];
}

type Base = 'dec' | 'hex';

function formatValue(v: number, base: Base): string {
  if (base === 'hex') {
    return '0x' + ((v >>> 0).toString(16).toUpperCase().padStart(8, '0'));
  }
  // signed 32-bit decimal display, with `tabular-nums` upstream for alignment
  const signed = (v | 0).toString();
  return signed;
}

export default function RegistersPanel({ state, prevRegisters }: RegistersPanelProps) {
  const [base, setBase] = useState<Base>('dec');

  const writeReg = state.muxOutputs.regDst;
  const writingThisStep = state.controlSignals.regWrite === 1;
  const rs = state.instructionFields.rs;
  const rt = state.instructionFields.rt;

  const renderRow = (
    name: string,
    value: number,
    opts: {
      key: string | number;
      isRead?: boolean;
      isWrite?: boolean;
      changed?: boolean;
      muted?: boolean;
    },
  ) => {
    const { key, isRead, isWrite, changed, muted } = opts;
    let bg = 'bg-white';
    if (isWrite) bg = 'bg-emerald-50';
    else if (isRead) bg = 'bg-amber-50';
    return (
      <div
        key={key}
        className={`flex items-center justify-between px-2 py-[3px] border-b border-zinc-100 last:border-b-0 ${bg} ${
          changed ? 'ring-1 ring-inset ring-blue-300' : ''
        } ${muted ? 'opacity-70' : ''}`}
        title={`${name} = ${formatValue(value, base === 'dec' ? 'hex' : 'dec')}`}
      >
        <span
          className={`text-[10px] font-mono ${
            isWrite
              ? 'text-emerald-700 font-semibold'
              : isRead
                ? 'text-amber-700 font-semibold'
                : 'text-zinc-500'
          }`}
        >
          {name}
        </span>
        <span
          className={`text-[10px] font-mono tabular-nums truncate ml-2 ${
            isWrite || isRead ? 'text-zinc-900 font-semibold' : 'text-zinc-800'
          }`}
        >
          {formatValue(value, base)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-md flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 border-b border-zinc-200 shrink-0 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider m-0">
          Registers
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
        {state.registers.slice(0, 32).map((val, i) => {
          const isRead = i === rs || i === rt;
          const isWrite = writingThisStep && i === writeReg;
          const changed = prevRegisters[i] !== undefined && prevRegisters[i] !== val;
          const regName = REG_NAMES[i] ?? `$${i}`;
          return renderRow(`${regName} ($${i})`, val, {
            key: i,
            isRead,
            isWrite,
            changed,
            muted: i === 0,
          });
        })}
        <div className="border-t border-zinc-200">
          {renderRow('PC', state.pc, { key: 'pc' })}
          {renderRow('HI', state.hi, { key: 'hi' })}
          {renderRow('LO', state.lo, { key: 'lo' })}
        </div>
      </div>
    </div>
  );
}
