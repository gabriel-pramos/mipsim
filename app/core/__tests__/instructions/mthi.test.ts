import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mthi', () => {
  it('moves rs to HI', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x1234 },
      { type: 'r_type', op: 'mthi', rs: REG.t0 },
      { type: 'r_type', op: 'mfhi', rd: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0x1234);
  });

  it('HI can be updated again before mfhi', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'mthi', rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 2 },
      { type: 'r_type', op: 'mthi', rs: REG.t0 },
      { type: 'r_type', op: 'mfhi', rd: REG.t1 },
    ]);
    stepN(p, 5);
    expect(p.getState().registers[REG.t1]).toBe(2);
  });
});
