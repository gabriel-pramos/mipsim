import { describe, it, expect } from '@jest/globals';
import type { Instruction } from '../../encoding';
import { loadFromInstructions, REG, stepN } from '../helpers/processorTestHarness';

/** MIPS calling convention registers used in tests. */
const A0 = 4;
const V0 = 2;
const RA = REG.ra;
const SP = 29;

/**
 * Square via explicit call — `main` passes n in `$a0`, result in `$v0`.
 *
 * ```
 *         .text
 *         .globl main
 *
 * main:
 *         addiu $sp, $zero, 0x1800   # stack (simulator starts $sp at 0)
 *         li      $a0, 7
 *         jal     square
 *         j       done
 *
 * # square(n) — argument $a0, returns $v0 = n*n
 * square:
 *         mul     $v0, $a0, $a0
 *         jr      $ra
 *
 * done:
 *         j       done
 * ```
 *
 * Taken `jal`/`j` jump directly (no delay-slot instruction runs).
 */
const SQUARE_PROGRAM: Instruction[] = [
  { type: 'i_type', op: 'addiu', rt: SP, rs: REG.zero, immediate: 0x1800 },
  { type: 'i_type', op: 'addiu', rt: A0, rs: REG.zero, immediate: 7 },
  { type: 'j_type', op: 'jal', target: 4 },
  { type: 'j_type', op: 'j', target: 6 },
  { type: 'r_type', op: 'mul', rd: V0, rs: A0, rt: A0 },
  { type: 'r_type', op: 'jr', rs: RA },
  { type: 'j_type', op: 'j', target: 6 },
];

describe('program: square (function call)', () => {
  it('returns n*n in $v0 for n=7', () => {
    const p = loadFromInstructions(SQUARE_PROGRAM);
    stepN(p, 64);
    expect(p.getState().registers[V0]).toBe(49);
    expect(p.getState().registers[A0]).toBe(7);
  });
});
