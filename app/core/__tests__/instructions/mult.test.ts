import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mult', () => {
  it('signed multiply into HI/LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 5 },
      { type: 'r_type', op: 'mult', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(-10);
  });

  it('product wider than 32 bits exposes non-zero HI', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'mult', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
      { type: 'r_type', op: 'mflo', rd: REG.t3 },
    ]);
    stepN(p, 5);
    expect(p.getState().registers[REG.t2]).toBe(1);
    expect(p.getState().registers[REG.t3]).toBe(0);
  });

  it('multiplies two positives', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 12 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 11 },
      { type: 'r_type', op: 'mult', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(132);
  });
});
