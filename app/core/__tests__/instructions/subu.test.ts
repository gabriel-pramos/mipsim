import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('subu', () => {
  it('unsigned subtract modulo 2^32', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 10 },
      { type: 'r_type', op: 'subu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe((3 - 10) >>> 0);
  });

  it('unsigned wrap when minuend is smaller (already negative as signed)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'r_type', op: 'subu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe((1 - 2) >>> 0);
  });

  it('larger minus smaller matches ordinary subtraction', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 100 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 25 },
      { type: 'r_type', op: 'subu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(75);
  });
});
