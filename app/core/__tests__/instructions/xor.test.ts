import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('xor', () => {
  it('bitwise xor', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00ff },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x0f0f },
      { type: 'r_type', op: 'xor', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0x0ff0);
  });

  it('xor with self clears to 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x55 },
      { type: 'r_type', op: 'xor', rd: REG.t1, rs: REG.t0, rt: REG.t0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('toggles bits using a mask', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0b1010 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0b1111 },
      { type: 'r_type', op: 'xor', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0b0101);
  });
});
