import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('multu', () => {
  it('unsigned multiply into HI/LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x0002 },
      { type: 'r_type', op: 'multu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0x1fffe);
  });

  it('HI holds high word of 64-bit product', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'multu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
      { type: 'r_type', op: 'mflo', rd: REG.t3 },
    ]);
    stepN(p, 5);
    expect(p.getState().registers[REG.t2]).toBe(1);
    expect(p.getState().registers[REG.t3]).toBe(0);
  });

  it('1 times large unsigned value', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'multu', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0xffff);
  });
});
