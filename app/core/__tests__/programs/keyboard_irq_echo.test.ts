import { describe, it, expect } from '@jest/globals';
import type { Instruction } from '../../encoding';
import { loadFromUserAndKernel, REG, stepN } from '../helpers/processorTestHarness';
import { MIPS_EXCEPTION_VECTOR } from '../../constants';

/**
 * User `.text` only (handler lives at {@link MIPS_EXCEPTION_VECTOR}).
 *
 * ```
 * .text
 * .globl main
 *     j setup
 * setup:
 *     lui $t0, 0xffff
 *     ori $t1, $zero, 1
 *     sw $t1, 0($t0)
 *     sw $t1, 0x10($t0)
 * main:
 *     j main
 *
 * .ktext 0x80000180
 * handler:
 *     lui $t2, 0xffff
 *     lw $t3, 4($t2)
 *     sw $t3, 0xc($t2)
 *     eret
 * ```
 */
const USER: Instruction[] = [
  { type: 'j_type', op: 'j', target: 1 },
  { type: 'i_type', op: 'lui', rt: REG.t0, immediate: 0xffff },
  { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 1 },
  { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
  { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0x10 },
  { type: 'j_type', op: 'j', target: 5 },
];

const KERNEL: Instruction[] = [
  { type: 'i_type', op: 'lui', rt: REG.t2, immediate: 0xffff },
  { type: 'i_type', op: 'lw', rt: REG.t3, base: REG.t2, offset: 4 },
  { type: 'i_type', op: 'sw', rt: REG.t3, base: REG.t2, offset: 0xc },
  { type: 'special', op: 'eret' },
];

describe('program: keyboard IRQ echo (vector 0x80000180)', () => {
  it('steps one instruction at a time through setup, IRQ, handler, and eret', () => {
    const p = loadFromUserAndKernel(USER, KERNEL);

    const r = () => p.getState().registers;
    const pc = () => p.getState().pc;

    stepN(p, 1);
    expect(pc()).toBe(4);
    expect(r()[REG.t0]).toBe(0);

    stepN(p, 1);
    expect(pc()).toBe(8);
    expect(r()[REG.t0] >>> 0).toBe(0xffff0000);

    stepN(p, 1);
    expect(pc()).toBe(12);
    expect(r()[REG.t1]).toBe(1);

    stepN(p, 1);
    expect(pc()).toBe(16);
    expect(p.getState().exception.keyboardInterruptEnable).toBe(true);

    stepN(p, 1);
    expect(pc()).toBe(20);
    expect(p.getState().exception.masterInterruptEnable).toBe(true);

    stepN(p, 1);
    expect(pc()).toBe(20);
    expect(p.getState().exception.exl).toBe(false);

    p.enqueueKeyboardAscii('K');

    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(true);
    expect(p.getState().exception.epc).toBe(20);
    expect(pc()).toBe(MIPS_EXCEPTION_VECTOR);

    stepN(p, 1);
    expect(pc()).toBe(MIPS_EXCEPTION_VECTOR + 4);
    expect(r()[REG.t2] >>> 0).toBe(0xffff0000);

    stepN(p, 1);
    expect(pc()).toBe(MIPS_EXCEPTION_VECTOR + 8);
    expect(r()[REG.t3]).toBe(0x4b);

    stepN(p, 1);
    expect(pc()).toBe(MIPS_EXCEPTION_VECTOR + 12);
    expect(p.getState().terminalOutput).toBe('K');

    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(false);
    expect(pc()).toBe(20);
  });
});
