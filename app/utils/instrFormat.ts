import type { Instruction } from '../core/encoding';
import { registerNumberToName } from './registerMap';

/** Canonical MIPS GPR names indexed by register number 0..31. */
export const REG_NAMES: readonly string[] = Array.from({ length: 32 }, (_, i) =>
  registerNumberToName(i),
);

/**
 * Render an `Instruction` as a short, human-readable mnemonic line for the UI.
 * Uses register numbers (e.g. `$8`) since the simulator works with normalized
 * numeric register fields. Mirrors the previous inline helper from `ProcessorView`.
 */
export function formatInstrText(instr: Instruction | undefined): string {
  if (!instr) return '—';
  const op = instr.op.toLowerCase();
  if (op === 'mfc0' || op === 'mtc0') {
    const rt = instr.rt ?? 0;
    const rd = instr.rd ?? 0;
    return `${op} $${rt}, $${rd}`;
  }
  let text = instr.op;
  if (instr.op === 'lw' || instr.op === 'sw') {
    text += ` $${instr.rt}, ${instr.offset ?? instr.immediate ?? 0}($${instr.base ?? instr.rs ?? 0})`;
  } else {
    if (instr.rd !== undefined) text += ` $${instr.rd}`;
    if (instr.rs !== undefined) text += `, $${instr.rs}`;
    if (instr.rt !== undefined) text += `, $${instr.rt}`;
    if (instr.immediate !== undefined) text += `, ${instr.immediate}`;
  }
  return text;
}
