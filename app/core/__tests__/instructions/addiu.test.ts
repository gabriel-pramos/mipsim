import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('addiu', () => {
  it('adds sign-extended immediate (unsigned 16-bit field)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 42 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(42);
  });

  it('sign-extends 16-bit immediates (e.g. -1)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0] | 0).toBe(-1);
  });

  it('adds into the same register (rs == rt)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 9 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.t0, immediate: 4 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(13);
  });
});
