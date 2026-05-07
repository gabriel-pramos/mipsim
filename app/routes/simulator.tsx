import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/simulator";
import ProcessorView from '../components/ProcessorView';
import ProcessorTerminal from '../components/ProcessorTerminal';
import InstructionList from '../components/InstructionList';
import RegistersPanel from '../components/RegistersPanel';
import DataMemoryPanel from '../components/DataMemoryPanel';
import { useProcessor } from '../core/processorContext';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MIPSim — Simulator" },
    { name: "description", content: "Visual MIPS processor simulator with step-by-step execution" },
  ];
}

export default function SimulatorPage() {
  const {
    state,
    prevRegisters,
    instructionWordMap,
    userTextWordCount,
    isRunning,
    executionSpeed,
    pastUser,
    breakpoints,
    step,
    run,
    stop,
    reset,
    sendToTerminal,
    setSpeed,
    toggleBreakpoint,
    clearBreakpoints,
  } = useProcessor();

  const [layoutResetKey, setLayoutResetKey] = useState(0);
  const resetLayout = useCallback(() => setLayoutResetKey((k) => k + 1), []);

  const stepDisabled = isRunning || pastUser;
  const runDisabled = pastUser;
  const pcWord = (state.pc >>> 2) >>> 0;

  // Keyboard shortcuts: F10 = step, F5 = run/stop, Ctrl+Shift+F5 = reset.
  // Skip when focus is in an editable element so we don't steal terminal/editor input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const editable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        !!target.closest('.monaco-editor')
      );
      if (editable) return;
      if (e.key === 'F10') {
        e.preventDefault();
        if (!stepDisabled) step();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (e.ctrlKey && e.shiftKey) {
          reset();
        } else if (isRunning) {
          stop();
        } else if (!runDisabled) {
          run();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, run, stop, reset, isRunning, stepDisabled, runDisabled]);

  if (userTextWordCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-500 mb-3">No program loaded.</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors"
          >
            Go to Editor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3">
      {/* Controls bar */}
      <div className="bg-white border border-zinc-200 rounded-md h-10 flex items-center px-3 gap-3 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={step}
            disabled={stepDisabled}
            title="Step (F10)"
            className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
              stepDisabled
                ? 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed'
                : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 cursor-pointer'
            }`}
          >
            Step
          </button>
          <button
            onClick={isRunning ? stop : run}
            disabled={runDisabled}
            title={isRunning ? 'Stop (F5)' : 'Run (F5)'}
            className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
              runDisabled
                ? 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed'
                : isRunning
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 cursor-pointer'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            {isRunning ? 'Stop' : 'Run'}
          </button>
          <button
            onClick={reset}
            title="Reset (Ctrl+Shift+F5)"
            className="px-3 py-1 text-xs font-medium rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-200" />

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Speed</span>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={executionSpeed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-24 cursor-pointer accent-zinc-600"
          />
          <span className="text-zinc-600 font-mono tabular-nums w-12">{executionSpeed}ms</span>
        </div>

        <div className="w-px h-5 bg-zinc-200" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={resetLayout}
            title="Reset draggable component positions"
            className="px-2 py-1 text-xs font-medium rounded border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Reset Layout
          </button>
          <button
            onClick={clearBreakpoints}
            disabled={breakpoints.size === 0}
            title="Clear all breakpoints"
            className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
              breakpoints.size === 0
                ? 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 cursor-pointer'
            }`}
          >
            Clear BPs
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-200" />

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">PC</span>
            <span className="font-mono font-semibold text-zinc-900 tabular-nums">{state.pc}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Instr</span>
            <span className="font-mono font-semibold text-zinc-900 tabular-nums">
              {pcWord} / {userTextWordCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">BPs</span>
            <span className="font-mono font-semibold text-zinc-900 tabular-nums">
              {breakpoints.size}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Status</span>
            <span
              aria-live="polite"
              className={`font-mono font-semibold ${
                isRunning
                  ? 'text-emerald-600'
                  : pastUser
                    ? 'text-zinc-400'
                    : 'text-zinc-700'
              }`}
            >
              {isRunning ? 'Running' : pastUser ? 'Finished' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main row: [instructions over datapath] | registers + data memory */}
      <div className="min-h-0 grid grid-cols-[minmax(0,1fr)_280px] gap-3">
        <div className="min-h-0 min-w-0 grid grid-rows-[200px_minmax(0,1fr)] gap-3">
          <InstructionList
            instructionWordMap={instructionWordMap}
            userTextWordCount={userTextWordCount}
            currentPcWord={pcWord}
            breakpoints={breakpoints}
            onToggleBreakpoint={toggleBreakpoint}
            isRunning={isRunning}
            pastUser={pastUser}
          />
          <div className="min-h-0 min-w-0 flex">
            <ProcessorView
              state={state}
              instructionWordMap={instructionWordMap}
              layoutResetKey={layoutResetKey}
            />
          </div>
        </div>

        <div className="min-h-0 min-w-0 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <RegistersPanel state={state} prevRegisters={prevRegisters} />
          <DataMemoryPanel state={state} />
        </div>
      </div>

      {/* Terminal */}
      <ProcessorTerminal
        output={state.terminalOutput}
        exception={state.exception}
        cop0={state.cop0}
        onSubmitLine={sendToTerminal}
      />
    </div>
  );
}
