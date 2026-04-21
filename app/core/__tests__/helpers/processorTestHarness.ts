import { Processor } from '../../Processor';
import { MIPS_EXCEPTION_VECTOR } from '../../constants';
import type { Instruction } from '../../encoding';
import {
  normalizeInstructions,
  type ParsedInstruction,
} from '../../../utils/instructionConverter';

/** Common GPR indices for tests ($zero, $t0–$t4, $s0, $ra). */
export const REG = {
  zero: 0,
  t0: 8,
  t1: 9,
  t2: 10,
  t3: 11,
  t4: 12,
  s0: 16,
  ra: 31,
} as const;

export function stepN(processor: Processor, n: number): void {
  for (let i = 0; i < n; i++) {
    processor.step();
  }
}

export function stepUntil(processor: Processor, maxSteps: number): void {
  stepN(processor, maxSteps);
}

export function loadFromInstructions(instructions: Instruction[]): Processor {
  const p = new Processor(instructions);
  p.reset();
  return p;
}

/** Kernel instructions at {@link MIPS_EXCEPTION_VECTOR} (word-aligned). */
export function loadFromUserAndKernel(
  user: Instruction[],
  kernel: Instruction[],
): Processor {
  const map = new Map<number, Instruction>();
  user.forEach((ins, i) => map.set(i, ins));
  const k0 = (MIPS_EXCEPTION_VECTOR >>> 2) >>> 0;
  kernel.forEach((ins, i) => map.set(k0 + i, ins));
  const p = new Processor();
  p.loadInstructionMap(map, user.length);
  return p;
}

/**
 * Normalizes parser output (register names → indices). Use when you already
 * have a `text` array from {@link MIPSParser} outside Jest, or in tests that
 * construct AST-shaped objects.
 */
export function loadFromParsedText(text: ParsedInstruction[]): Processor {
  const normalized = normalizeInstructions(text);
  const p = new Processor(normalized as Instruction[]);
  p.reset();
  return p;
}
