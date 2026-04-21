import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('slti', () => {
  it('1 when rs < signed immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'slti', rt: REG.t1, rs: REG.t0, immediate: 10 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });

  it('0 when rs >= signed immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'i_type', op: 'slti', rt: REG.t1, rs: REG.t0, immediate: 3 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('1 when rs is negative and immediate is 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -5 },
      { type: 'i_type', op: 'slti', rt: REG.t1, rs: REG.t0, immediate: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });

  it('compares against sign-extended negative immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -10 },
      { type: 'i_type', op: 'slti', rt: REG.t1, rs: REG.t0, immediate: -3 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });
});
