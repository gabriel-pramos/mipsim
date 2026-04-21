import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('mul', () => {
  it('low 32 bits of product in rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 6 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
      { type: 'r_type', op: 'mul', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(42);
  });

  it('multiply by zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 123 },
      { type: 'r_type', op: 'mul', rd: REG.t1, rs: REG.t0, rt: REG.zero },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('negative times negative', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -4 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: -5 },
      { type: 'r_type', op: 'mul', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(20);
  });
});
