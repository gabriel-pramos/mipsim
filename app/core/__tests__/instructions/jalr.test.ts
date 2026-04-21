import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('jalr', () => {
  it('jumps to rs and stores return in rd (default $ra)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 12 },
      { type: 'r_type', op: 'jalr', rd: REG.ra, rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.ra]).toBe(8);
  });

  it('two-operand form writes link to explicit rd', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 16 },
      { type: 'r_type', op: 'jalr', rd: REG.t3, rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(20);
    expect(p.getState().registers[REG.t3]).toBe(8);
  });

  it('return address is PC+8 when skipping one slot', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 12 },
      { type: 'r_type', op: 'jalr', rd: REG.ra, rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 9 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.ra]).toBe(8);
    expect(p.getState().registers[REG.t2]).toBe(9);
  });
});
