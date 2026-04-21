import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('nor', () => {
  it('bitwise nor', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0 },
      { type: 'r_type', op: 'nor', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(~0 >>> 0);
  });

  it('nor of complementary patterns', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0x00ff },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xff00 },
      { type: 'r_type', op: 'nor', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(~(0x00ff | 0xff00) >>> 0);
  });

  it('nor with all ones on one side', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0xffff },
      { type: 'r_type', op: 'nor', rd: REG.t1, rs: REG.t0, rt: REG.zero },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });
});
