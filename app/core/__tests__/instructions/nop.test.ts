import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('nop', () => {
  it('does not change architectural state besides PC', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 5 },
      { type: 'special', op: 'nop' },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.t0, immediate: 1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t0]).toBe(5);
    expect(p.getState().registers[REG.t1]).toBe(6);
  });

  it('allows multiple consecutive nops', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'special', op: 'nop' },
      { type: 'special', op: 'nop' },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.t0, immediate: 1 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t0]).toBe(11);
  });

  it('does not write $zero', () => {
    const p = loadFromInstructions([
      { type: 'special', op: 'nop' },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.zero]).toBe(0);
  });
});
