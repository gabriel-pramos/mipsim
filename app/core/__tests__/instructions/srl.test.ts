import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('srl', () => {
  it('logical right shift by shamt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x100 },
      { type: 'r_type', op: 'srl', rd: REG.t2, rt: REG.t1, shamt: 4 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(0x10);
  });

  it('shift by 0 is identity', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xabc },
      { type: 'r_type', op: 'srl', rd: REG.t2, rt: REG.t1, shamt: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(0xabc);
  });

  it('zeros fill from the left', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0xffff },
      { type: 'r_type', op: 'srl', rd: REG.t2, rt: REG.t1, shamt: 4 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0x0fffffff);
  });
});
