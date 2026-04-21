import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('or', () => {
  it('bitwise or', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00f0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x000f },
      { type: 'r_type', op: 'or', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0x00ff);
  });

  it('or with zero is identity', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0xcc },
      { type: 'r_type', op: 'or', rd: REG.t1, rs: REG.t0, rt: REG.zero },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0xcc);
  });

  it('combines disjoint bit fields', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0xf000 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0x000f },
      { type: 'r_type', op: 'or', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0xf00f);
  });
});
