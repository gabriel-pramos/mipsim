import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mtlo', () => {
  it('moves rs to LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x5678 },
      { type: 'r_type', op: 'mtlo', rs: REG.t0 },
      { type: 'r_type', op: 'mflo', rd: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0x5678);
  });

  it('LO survives an unrelated mult if followed by mtlo again', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x1111 },
      { type: 'r_type', op: 'mtlo', rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 3 },
      { type: 'r_type', op: 'mult', rs: REG.t1, rt: REG.t2 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x2222 },
      { type: 'r_type', op: 'mtlo', rs: REG.t0 },
      { type: 'r_type', op: 'mflo', rd: REG.t3 },
    ]);
    stepN(p, 8);
    expect(p.getState().registers[REG.t3]).toBe(0x2222);
  });
});
