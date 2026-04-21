import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lb', () => {
  it('loads byte sign-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x400 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xffffff80 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lb', rt: REG.t2, base: REG.t0, offset: 3 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(-128);
  });

  it('loads most-significant byte as signed', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x500 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x7f },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lb', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(0);
  });

  it('positive byte in LS position', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x508 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x7f },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lb', rt: REG.t2, base: REG.t0, offset: 3 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(0x7f);
  });
});
