import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('move', () => {
  it('copies rs to rd (pseudo: addiu rd, rs, 0)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 100 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.t1, immediate: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(100);
  });

  it('copies into a different destination register', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 33 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.t1, immediate: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(33);
    expect(p.getState().registers[REG.t1]).toBe(33);
  });

  it('copies zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 0 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });
});
