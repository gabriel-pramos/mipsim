import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('bltzal', () => {
  it('branches and links when rs < 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -1 },
      { type: 'i_type', op: 'bltzal', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 4 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.ra]).toBe(8);
    expect(p.getState().registers[REG.t2]).toBe(4);
  });

  it('does not branch and link when rs >= 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'bltzal', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 6 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(12);
  });

  it('still runs delay slot when branch not taken', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'bltzal', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(7);
  });
});
