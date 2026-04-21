import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('syscall', () => {
  it('traps to environment (e.g. exit) — observable no-op until implemented', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'special', op: 'syscall' },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(2);
  });

  it('does not clear a register set before syscall', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x1234 },
      { type: 'special', op: 'syscall' },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x1234);
  });

  it('syscall as first instruction still advances PC', () => {
    const p = loadFromInstructions([
      { type: 'special', op: 'syscall' },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 5 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(5);
  });
});
