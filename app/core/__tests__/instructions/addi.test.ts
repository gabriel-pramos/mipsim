import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('addi', () => {
  it('adds sign-extended immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 5 },
      { type: 'i_type', op: 'addi', rt: REG.t1, rs: REG.t0, immediate: 3 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(8);
  });

  it('handles minimum 16-bit immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addi', rt: REG.t0, rs: REG.zero, immediate: -32768 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0] | 0).toBe(-32768);
  });

  it('adds negative immediate to a non-zero base', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 100 },
      { type: 'i_type', op: 'addi', rt: REG.t1, rs: REG.t0, immediate: -30 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(70);
  });

  it('uses rs as base (not only $zero)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 200 },
      { type: 'i_type', op: 'addi', rt: REG.t0, rs: REG.t0, immediate: 7 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(207);
  });
});
