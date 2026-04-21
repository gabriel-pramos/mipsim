import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mfhi', () => {
  it('moves HI to rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 3 },
      { type: 'r_type', op: 'mult', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });

  it('reads HI after mthi', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xdead },
      { type: 'r_type', op: 'mthi', rs: REG.t0 },
      { type: 'r_type', op: 'mfhi', rd: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0xdead0000 >>> 0);
  });
});
