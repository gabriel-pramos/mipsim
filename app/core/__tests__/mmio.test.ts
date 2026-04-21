import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from './helpers/processorTestHarness';
import type { Instruction } from '../encoding';

describe('MMIO keyboard and display (MARS-style)', () => {
  it('writes display via sw to 0xFFFF000C', () => {
    const instructions: Instruction[] = [
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0x58 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0xc },
    ];
    const p = loadFromInstructions(instructions);
    stepN(p, 3);
    expect(p.getState().terminalOutput).toBe('X');
  });

  it('reads keyboard data after enqueue (lw)', () => {
    const instructions: Instruction[] = [
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'lw', rt: REG.t1, base: REG.t0, offset: 4 },
    ];
    const p = loadFromInstructions(instructions);
    p.enqueueKeyboardAscii('A');
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0x41);
  });

  it('keyboard control ready bit reflects queue', () => {
    const instructions: Instruction[] = [
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'lw', rt: REG.t1, base: REG.t0, offset: 0 },
    ];
    const p = loadFromInstructions(instructions);
    p.enqueueKeyboardAscii('z');
    stepN(p, 2);
    expect(p.getState().registers[REG.t1] & 2).toBe(2);
  });
});
