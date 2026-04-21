import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('bne', () => {
  it('branches when rs differs from rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'bne', rs: REG.t0, rt: REG.t1, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: REG.t3, rs: REG.zero, immediate: 7 },
    ]);
    stepN(p, 4);
    expect(p.getState().pc).toBe(20);
    expect(p.getState().registers[REG.t3]).toBe(7);
  });

  it('falls through when rs equals rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'bne', rs: REG.t0, rt: REG.t1, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 1 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(1);
  });

  it('does not branch when operands match (same as beq fall-through)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 8 },
      { type: 'i_type', op: 'bne', rs: REG.t0, rt: REG.t0, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });
});
