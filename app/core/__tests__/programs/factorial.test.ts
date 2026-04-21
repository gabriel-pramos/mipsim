import { describe, it, expect } from '@jest/globals';
import type { Instruction } from '../../encoding';
import { loadFromInstructions, REG, stepN } from '../helpers/processorTestHarness';

const A0 = 4;
const V0 = 2;
const T0 = 8;
const T1 = 9;
const RA = REG.ra;
const SP = 29;

/**
 * Recursive factorial with stack frame (`$ra`, `n` on stack). Base: `n <= 1` → return 1.
 * Uses `slt` + `beq` instead of `ble` (not in this ISA). Syscall/print omitted here; the
 * encoded program is the callable `factorial` plus `main` / `done`.
 *
 * ```
 *         .text
 *         .globl main
 *
 * main:
 *         addiu $sp, $zero, 0x1800
 *         li      $a0, 6
 *         jal     factorial
 *         j       done
 *
 * # factorial(n): $a0 = n, returns $v0 = n!
 * factorial:
 *         addi  $sp, $sp, -8
 *         sw    $ra, 4($sp)
 *         sw    $a0, 0($sp)
 *         li    $t0, 1
 *         slt   $t1, $t0, $a0       # $t1 = 1 iff n > 1
 *         beq   $t1, $zero, base_case
 *
 *         addi  $a0, $a0, -1
 *         jal   factorial
 *         lw    $a0, 0($sp)
 *         mul   $v0, $a0, $v0
 *         lw    $ra, 4($sp)
 *         addi  $sp, $sp, 8
 *         jr    $ra
 *
 * base_case:
 *         li    $v0, 1
 *         lw    $ra, 4($sp)
 *         addi  $sp, $sp, 8
 *         jr    $ra
 *
 * done:
 *         j     done
 * ```
 */
const FACTORIAL_5_PROGRAM: Instruction[] = [
  { type: 'i_type', op: 'addiu', rt: SP, rs: REG.zero, immediate: 0x1800 },
  { type: 'i_type', op: 'addiu', rt: A0, rs: REG.zero, immediate: 6 },
  { type: 'j_type', op: 'jal', target: 4 },
  { type: 'j_type', op: 'j', target: 21 },
  { type: 'i_type', op: 'addiu', rt: SP, rs: SP, immediate: -8 },
  { type: 'i_type', op: 'sw', rt: RA, base: SP, offset: 4 },
  { type: 'i_type', op: 'sw', rt: A0, base: SP, offset: 0 },
  { type: 'i_type', op: 'addiu', rt: T0, rs: REG.zero, immediate: 1 },
  { type: 'r_type', op: 'slt', rd: T1, rs: T0, rt: A0 },
  { type: 'i_type', op: 'beq', rs: T1, rt: REG.zero, immediate: 7 },
  { type: 'i_type', op: 'addiu', rt: A0, rs: A0, immediate: -1 },
  { type: 'j_type', op: 'jal', target: 4 },
  { type: 'i_type', op: 'lw', rt: A0, base: SP, offset: 0 },
  { type: 'r_type', op: 'mul', rd: V0, rs: A0, rt: V0 },
  { type: 'i_type', op: 'lw', rt: RA, base: SP, offset: 4 },
  { type: 'i_type', op: 'addiu', rt: SP, rs: SP, immediate: 8 },
  { type: 'r_type', op: 'jr', rs: RA },
  { type: 'i_type', op: 'addiu', rt: V0, rs: REG.zero, immediate: 1 },
  { type: 'i_type', op: 'lw', rt: RA, base: SP, offset: 4 },
  { type: 'i_type', op: 'addiu', rt: SP, rs: SP, immediate: 8 },
  { type: 'r_type', op: 'jr', rs: RA },
  { type: 'j_type', op: 'j', target: 21 },
];

describe('program: factorial (recursive function call)', () => {
  it('computes 6! = 720 in $v0', () => {
    const p = loadFromInstructions(FACTORIAL_5_PROGRAM);
    stepN(p, 4000);
    expect(p.getState().registers[V0]).toBe(720);
  });
});
