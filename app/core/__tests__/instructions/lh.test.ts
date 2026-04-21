import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lh', () => {
  it('loads halfword sign-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x300 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xff80 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lh', rt: REG.t2, base: REG.t0, offset: 2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(-128);
  });

  it('loads positive halfword sign-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x310 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0x1234 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lh', rt: REG.t2, base: REG.t0, offset: 2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(0x1234);
  });
});
