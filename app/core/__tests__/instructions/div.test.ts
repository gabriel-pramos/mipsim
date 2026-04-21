import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('div', () => {
  it('signed division quotient in LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 20 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 4 },
      { type: 'r_type', op: 'div', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(5);
  });

  it('signed remainder in HI', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 22 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 4 },
      { type: 'r_type', op: 'div', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mfhi', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(2);
  });

  it('truncates signed quotient toward zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -7 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'r_type', op: 'div', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(-3);
  });

  it('divide by one passes rs through LO', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'div', rs: REG.t0, rt: REG.t1 },
      { type: 'r_type', op: 'mflo', rd: REG.t2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(99);
  });
});
