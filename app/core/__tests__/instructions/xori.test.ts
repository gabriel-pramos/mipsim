import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('xori', () => {
  it('xor with zero-extended immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00ff },
      { type: 'i_type', op: 'xori', rt: REG.t1, rs: REG.t0, immediate: 0x0f0f },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0x0ff0);
  });

  it('xor immediate with zero is the zero-extended imm', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'xori', rt: REG.t0, rs: REG.zero, immediate: 0x00ab },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0xab);
  });

  it('clears bits that match the mask', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00ff },
      { type: 'i_type', op: 'xori', rt: REG.t0, rs: REG.t0, immediate: 0x000f },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x00f0);
  });
});
