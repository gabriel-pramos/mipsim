import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('j', () => {
  it('jumps to word-aligned address (target is word index)', () => {
    const p = loadFromInstructions([
      { type: 'j_type', op: 'j', target: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(1);
    expect(p.getState().registers[REG.t0]).toBe(0);
  });

  it('jumps over middle instructions to continue the same chain', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'j_type', op: 'j', target: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.t0, immediate: 1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t0]).toBe(11);
  });

  it('skips several instructions with a larger forward offset', () => {
    const p = loadFromInstructions([
      { type: 'j_type', op: 'j', target: 4 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 9 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(9);
    expect(p.getState().registers[REG.t0]).toBe(0);
  });
});
