import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('divu', () => {
  it('unsigned division quotient in LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 100 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
      { type: 'r_type', op: 'divu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(14);
  });

  it('remainder available in HI', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 100 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
      { type: 'r_type', op: 'divu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(2);
  });

  it('exact division leaves HI zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 24 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 6 },
      { type: 'r_type', op: 'divu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });
});
