import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sll', () => {
  it('logical left shift by shamt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'sll', rd: REG.t2, rt: REG.t1, shamt: 4 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(16);
  });

  it('shift by 0 is identity', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x55 },
      { type: 'r_type', op: 'sll', rd: REG.t2, rt: REG.t1, shamt: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(0x55);
  });

  it('discards bits shifted past bit 31', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0x8000 },
      { type: 'r_type', op: 'sll', rd: REG.t2, rt: REG.t1, shamt: 1 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });
});
