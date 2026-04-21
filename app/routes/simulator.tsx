import { Link } from 'react-router';
import type { Route } from "./+types/simulator";
import ProcessorView from '../components/ProcessorView';
import ProcessorTerminal from '../components/ProcessorTerminal';
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
    instructionWordMap,
    userTextWordCount,
    isRunning,
    executionSpeed,
    pastUser,
    step,
    run,
    stop,
    reset,
    sendToTerminal,
    setSpeed,
  } = useProcessor();

  const stepDisabled = isRunning || pastUser;
  const runDisabled = pastUser;

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
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Controls bar (top) */}
      <div className="shrink-0 bg-white border-b border-zinc-200 h-10 flex items-center px-4 gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={step}
            disabled={stepDisabled}
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">PC</span>
            <span className="font-mono font-semibold text-zinc-900">{state.pc}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Instr</span>
            <span className="font-mono font-semibold text-zinc-900">
              {(state.pc >>> 2) >>> 0} / {userTextWordCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Status</span>
            <span
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

      {/* Middle: datapath + data memory */}
      <div className="flex-1 min-h-0 flex gap-3 p-3">
        <div className="flex-1 min-w-0 min-h-0 flex">
          <ProcessorView
            state={state}
            instructionWordMap={instructionWordMap}
            userTextWordCount={userTextWordCount}
          />
        </div>

        <div className="w-56 shrink-0 bg-white border border-zinc-200 rounded-md flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b border-zinc-200 shrink-0">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider m-0">
              Data Memory
            </h3>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {Object.keys(state.dataMemoryContents).length === 0 ? (
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
                    <th className="text-right py-1 px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(state.dataMemoryContents)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([addr, val]) => {
                      const numAddr = Number(addr);
                      const isActive =
                        numAddr === state.dataMemory.address &&
                        (state.controlSignals.memRead ||
                          state.controlSignals.memWrite);
                      return (
                        <tr
                          key={addr}
                          className={`border-b border-zinc-100 ${
                            isActive ? 'bg-indigo-50' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <td className="py-1 px-2 font-mono text-[10px] text-zinc-600">
                            0x{numAddr.toString(16).toUpperCase().padStart(4, '0')}
                          </td>
                          <td className="py-1 px-2 font-mono text-[10px] text-right font-semibold text-zinc-900">
                            {val}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Terminal (bottom) */}
      <div className="shrink-0 px-3 pb-3">
        <ProcessorTerminal
          output={state.terminalOutput}
          exception={state.exception}
          cop0={state.cop0}
          onSubmitLine={sendToTerminal}
        />
      </div>
    </div>
  );
}
