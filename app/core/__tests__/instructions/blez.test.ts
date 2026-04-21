import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('blez', () => {
  it('branches when rs <= 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'blez', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 4);
    expect(p.getState().pc).toBe(20);
    expect(p.getState().registers[REG.t2]).toBe(2);
  });

  it('does not branch when rs > 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 5 },
      { type: 'i_type', op: 'blez', rs: REG.t0, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 9 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(9);
  });

  it('branches on strictly negative rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -1 },
      { type: 'i_type', op: 'blez', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 4 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(4);
    expect(p.getState().pc).toBe(20);
  });
});
