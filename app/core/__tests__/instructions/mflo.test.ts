import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mflo', () => {
  it('moves LO to rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 6 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
      { type: 'r_type', op: 'mult', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(42);
  });

  it('reads LO after unsigned divide', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 50 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 8 },
      { type: 'r_type', op: 'divu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(6);
  });
});
