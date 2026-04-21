import { useState, useRef } from 'react';
import { MIPSParser } from '../utils/mipsParser';
import { normalizeInstructions } from '../utils/instructionConverter';
import { SAMPLE_PROGRAMS } from '../utils/samplePrograms';
import type { Instruction } from '../core/encoding';

interface MIPSCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onLoadInstructions?: (
    map: Map<number, Instruction>,
    userTextWordCount: number,
    dataBytes?: number[],
  ) => void;
  onAfterLoad?: () => void;
}

export default function MIPSCodeEditor({
  code,
  onCodeChange,
  onLoadInstructions,
  onAfterLoad,
}: MIPSCodeEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const parserRef = useRef<MIPSParser | null>(null);

  const handleCodeChange = (newCode: string) => {
    onCodeChange(newCode);
    setError(null);
    setSuccess(null);
  };

  const handleSampleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const sample = SAMPLE_PROGRAMS.find((s) => s.id === id);
    if (sample) {
      onCodeChange(sample.code);
      setError(null);
      setSuccess(null);
    }
    e.target.value = '';
  };

  const handleLoad = async () => {
    setError(null);
    setSuccess(null);
    try {
      if (onLoadInstructions) {
        if (!parserRef.current) {
          parserRef.current = new MIPSParser();
        } else {
          parserRef.current.reset();
        }

        const parser = parserRef.current;
        const result = await parser.processProgram(code + '\n');

        const rawMap: Map<number, Instruction> =
          result.instructionWordMap ?? new Map();
        const normalizedMap = new Map<number, Instruction>();
        for (const [wi, ins] of rawMap.entries()) {
          const [one] = normalizeInstructions([ins as any]);
          normalizedMap.set(wi, one as Instruction);
        }

        const userTextWordCount = result.userTextWordCount ?? 0;
        onLoadInstructions(normalizedMap, userTextWordCount, parser.data);

        const symbolCount = parser.symbols.size;
        const dataSize = parser.data.length;
        const kernelWords = normalizedMap.size - userTextWordCount;
        let message = `Loaded ${userTextWordCount} user instruction word(s)`;
        if (kernelWords > 0) {
          message += `, ${kernelWords} kernel word(s) at 0x80000180`;
        }
        if (symbolCount > 0) {
          message += `, ${symbolCount} symbol(s)`;
        }
        if (dataSize > 0) {
          message += `, ${dataSize} byte(s) of data`;
        }
        setSuccess(message);
        onAfterLoad?.();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unknown error parsing MIPS code',
      );
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-md flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center gap-3">
        <select
          onChange={handleSampleChange}
          defaultValue=""
          className="text-sm bg-white border border-zinc-300 rounded-md px-2.5 py-1.5 text-zinc-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="" disabled>
            Load sample...
          </option>
          {SAMPLE_PROGRAMS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="ml-auto">
          <button
            onClick={handleLoad}
            className="px-4 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-md border border-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Load &amp; Simulate
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="flex-1 min-h-[360px] p-4 font-mono text-sm leading-relaxed border-none outline-none resize-none bg-zinc-50 text-zinc-900"
        spellCheck={false}
        placeholder="Enter MIPS assembly code..."
      />

      {/* Status messages */}
      {error && (
        <div className="px-4 py-2.5 bg-red-50 border-t border-red-200 text-red-700 text-sm font-mono whitespace-pre-line">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-200 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {/* Instruction reference */}
      <details className="border-t border-zinc-200">
        <summary className="px-4 py-2 text-xs font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 select-none">
          Supported instructions
        </summary>
        <div className="px-4 pb-3 text-xs text-zinc-500 space-y-1">
          <p>
            <span className="font-medium text-zinc-600">R-type:</span> add,
            addu, sub, subu, and, or, xor, nor, slt, sltu, sll, srl, sra,
            sllv, srlv, srav, mult, multu, div, divu, mfhi, mflo, jr, jalr
          </p>
          <p>
            <span className="font-medium text-zinc-600">I-type:</span> addi,
            addiu, andi, ori, xori, slti, sltiu, lui, beq, bne, blez, bgtz,
            bltz, bgez, lw, lh, lhu, lb, lbu, sw, sh, sb
          </p>
          <p>
            <span className="font-medium text-zinc-600">J-type:</span> j, jal
          </p>
          <p>
            <span className="font-medium text-zinc-600">Special:</span>{' '}
            syscall, eret, nop
          </p>
          <p>
            <span className="font-medium text-zinc-600">COP0:</span> mfc0,
            mtc0 (second operand is{' '}
            <code className="bg-zinc-100 px-1 rounded text-zinc-600">$n</code>{' '}
            = CP0 reg <em>n</em>, MARS-style)
          </p>
          <p>
            <span className="font-medium text-zinc-600">Segments:</span>{' '}
            <code className="bg-zinc-100 px-1 rounded text-zinc-600">.data</code>,{' '}
            <code className="bg-zinc-100 px-1 rounded text-zinc-600">.text</code>,{' '}
            <code className="bg-zinc-100 px-1 rounded text-zinc-600">
              .ktext 0x80000180
            </code>
          </p>
          <p>
            <span className="font-medium text-zinc-600">Pseudo:</span> li, la,
            move
          </p>
        </div>
      </details>
    </div>
  );
}
