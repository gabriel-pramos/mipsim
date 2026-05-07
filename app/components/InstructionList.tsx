import { useEffect, useMemo, useRef } from 'react';
import type { Instruction } from '../core/encoding';
import { MIPS_EXCEPTION_VECTOR } from '../core/constants';
import { formatInstrText } from '../utils/instrFormat';

interface InstructionListProps {
  instructionWordMap: Map<number, Instruction>;
  userTextWordCount: number;
  currentPcWord: number;
  breakpoints: Set<number>;
  onToggleBreakpoint: (wordIdx: number) => void;
  isRunning: boolean;
  pastUser: boolean;
}

const KERNEL_BASE_WORD = (MIPS_EXCEPTION_VECTOR >>> 2) >>> 0;

interface Row {
  wordIdx: number;
  byteAddr: number;
  instr: Instruction | undefined;
}

export default function InstructionList({
  instructionWordMap,
  userTextWordCount,
  currentPcWord,
  breakpoints,
  onToggleBreakpoint,
  isRunning,
  pastUser,
}: InstructionListProps) {
  const userRows: Row[] = useMemo(
    () =>
      Array.from({ length: userTextWordCount }, (_, idx) => ({
        wordIdx: idx,
        byteAddr: idx * 4,
        instr: instructionWordMap.get(idx),
      })),
    [instructionWordMap, userTextWordCount],
  );

  const kernelRows: Row[] = useMemo(() => {
    const rows: Row[] = [];
    for (const [k, instr] of instructionWordMap) {
      if (k >= KERNEL_BASE_WORD) rows.push({ wordIdx: k, byteAddr: k * 4, instr });
    }
    rows.sort((a, b) => a.wordIdx - b.wordIdx);
    return rows;
  }, [instructionWordMap]);

  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeRowRef.current || !listRef.current) return;
    const row = activeRowRef.current;
    const container = listRef.current;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (rowTop < viewTop || rowBottom > viewBottom) {
      row.scrollIntoView({ block: 'nearest', behavior: isRunning ? 'auto' : 'smooth' });
    }
  }, [currentPcWord, isRunning]);

  const renderRow = (row: Row) => {
    const isActive = row.wordIdx === currentPcWord;
    const hasBp = breakpoints.has(row.wordIdx);
    return (
      <div
        key={row.wordIdx}
        ref={isActive ? activeRowRef : null}
        className={`group flex items-center gap-1 px-1 py-[3px] border-l-2 text-[10.5px] font-mono leading-tight ${
          isActive
            ? 'bg-indigo-50 border-indigo-500'
            : 'border-transparent hover:bg-zinc-50'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleBreakpoint(row.wordIdx)}
          aria-label={hasBp ? 'Remove breakpoint' : 'Add breakpoint'}
          aria-pressed={hasBp}
          className={`shrink-0 w-3 h-3 rounded-full border transition-colors cursor-pointer ${
            hasBp
              ? 'bg-red-500 border-red-500'
              : 'bg-transparent border-zinc-300 group-hover:border-zinc-400'
          }`}
        />
        <span className="shrink-0 w-3 text-zinc-400 text-center">
          {isActive ? '▶' : ''}
        </span>
        <span className="shrink-0 text-zinc-400 tabular-nums">
          0x{row.byteAddr.toString(16).toUpperCase().padStart(4, '0')}
        </span>
        <span
          className={`truncate ${
            isActive ? 'text-indigo-900 font-semibold' : 'text-zinc-700'
          }`}
          title={row.instr ? formatInstrText(row.instr) : 'nop'}
        >
          {row.instr ? formatInstrText(row.instr) : 'nop'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-md flex flex-col overflow-hidden h-full">
      <div className="px-3 py-1.5 border-b border-zinc-200 shrink-0 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider m-0">
          Instructions
        </h3>
        <span className="text-[10px] text-zinc-400 tabular-nums">
          {userTextWordCount} {userTextWordCount === 1 ? 'word' : 'words'}
          {breakpoints.size > 0 ? ` · ${breakpoints.size} BP` : ''}
        </span>
      </div>
      <div
        ref={listRef}
        className={`flex-1 min-h-0 overflow-auto py-1 ${pastUser ? 'opacity-60' : ''}`}
      >
        {userRows.length === 0 ? (
          <div className="text-center text-xs text-zinc-400 py-6">
            No program loaded
          </div>
        ) : (
          userRows.map(renderRow)
        )}
        {kernelRows.length > 0 && (
          <>
            <div className="px-2 mt-2 mb-0.5 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
              Kernel · 0x{MIPS_EXCEPTION_VECTOR.toString(16).toUpperCase()}
            </div>
            {kernelRows.map(renderRow)}
          </>
        )}
      </div>
      {pastUser && userRows.length > 0 && (
        <div className="shrink-0 border-t border-zinc-200 px-3 py-1 text-[10px] text-zinc-500 bg-zinc-50">
          Program finished
        </div>
      )}
    </div>
  );
}
