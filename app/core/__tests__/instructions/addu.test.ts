import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('addu', () => {
  it('32-bit addition same as add for non-overflowing positives', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 20000 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 20000 },
      { type: 'r_type', op: 'addu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(40000);
  });

  it('wraps modulo 2^32 like unsigned addition', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0xfffe },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'r_type', op: 'addu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });

  it('treats $zero as 0 for rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 77 },
      { type: 'r_type', op: 'addu', rd: REG.t1, rs: REG.t0, rt: REG.zero },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(77);
  });
});
