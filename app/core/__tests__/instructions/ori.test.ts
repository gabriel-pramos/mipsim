import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('ori', () => {
  it('or with zero-extended immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x00f0 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t0, immediate: 0x000f },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0x00ff);
  });

  it('ori from $zero builds a small constant', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0xface },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0xface);
  });

  it('sets bits in a running value', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x100 },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0x0003 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x103);
  });
});
