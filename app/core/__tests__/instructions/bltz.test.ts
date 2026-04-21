import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('bltz', () => {
  it('branches when rs < 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -1 },
      { type: 'i_type', op: 'bltz', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 3 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.t2]).toBe(3);
  });

  it('does not branch when rs >= 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'bltz', rs: REG.t0, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(7);
  });

  it('branches on large negative', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -32768 },
      { type: 'i_type', op: 'bltz', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(2);
  });
});
