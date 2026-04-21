import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('andi', () => {
  it('and with zero-extended immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00ff },
      { type: 'i_type', op: 'andi', rt: REG.t1, rs: REG.t0, immediate: 0xf00f },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0x000f);
  });

  it('zero-extends immediate so high bit of imm does not sign-fill', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0xffff },
      { type: 'i_type', op: 'andi', rt: REG.t1, rs: REG.t0, immediate: 0xf00f },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0xf00f);
  });

  it('masks to low byte', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x1234 },
      { type: 'i_type', op: 'andi', rt: REG.t1, rs: REG.t0, immediate: 0x00ff },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0x34);
  });
});
