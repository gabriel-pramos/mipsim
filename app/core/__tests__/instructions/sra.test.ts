import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sra', () => {
  it('arithmetic right shift by shamt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xfff0 },
      { type: 'r_type', op: 'sra', rd: REG.t2, rt: REG.t1, shamt: 4 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2] | 0).toBe((0xfffffff0 >> 4) | 0);
  });

  it('shift by 0 is identity', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xfff0 },
      { type: 'r_type', op: 'sra', rd: REG.t2, rt: REG.t1, shamt: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2] | 0).toBe(-16);
  });

  it('fills with zero for positive operand', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x100 },
      { type: 'r_type', op: 'sra', rd: REG.t2, rt: REG.t1, shamt: 4 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(0x10);
  });
});
