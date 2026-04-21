import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('beq', () => {
  it('branches when rs equals rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'beq', rs: REG.zero, rt: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 42 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.t1]).toBe(42);
  });

  it('falls through when rs differs from rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'beq', rs: REG.t0, rt: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 5 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 9 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t1]).toBe(5);
  });

  it('branches when equal operands are non-zero', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 11 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 11 },
      { type: 'i_type', op: 'beq', rs: REG.t0, rt: REG.t1, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t3, rs: REG.zero, immediate: 22 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t3]).toBe(22);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });

  it('records next PC after linear fall-through', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 2);
    expect(p.getState().pc).toBe(8);
  });
});
