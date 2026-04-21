import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sub', () => {
  it('subtracts rt from rs into rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 3 },
      { type: 'r_type', op: 'sub', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(7);
  });

  it('produces negative 32-bit difference', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 10 },
      { type: 'r_type', op: 'sub', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2] | 0).toBe(-7);
  });

  it('subtracting zero is identity', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 88 },
      { type: 'r_type', op: 'sub', rd: REG.t1, rs: REG.t0, rt: REG.zero },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(88);
  });
});
