import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('add', () => {
  it('adds rs and rt into rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 3 },
      { type: 'r_type', op: 'add', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    expect(p.getState().registers[REG.t2]).toBe(0);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(13);
  });

  it('adds when rs is $zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 40 },
      { type: 'r_type', op: 'add', rd: REG.t2, rs: REG.zero, rt: REG.t1 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(40);
  });

  it('adds two zeros', () => {
    const p = loadFromInstructions([
      { type: 'r_type', op: 'add', rd: REG.t0, rs: REG.zero, rt: REG.zero },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0);
  });
});
