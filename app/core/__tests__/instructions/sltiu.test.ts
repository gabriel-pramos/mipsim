import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sltiu', () => {
  it('compares rs to zero-extended immediate as unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 5 },
      { type: 'i_type', op: 'sltiu', rt: REG.t1, rs: REG.t0, immediate: 10 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });

  it('immediate 0xffff is large unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'sltiu', rt: REG.t1, rs: REG.t0, immediate: 0xffff },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });

  it('0 when rs (all bits set unsigned) is not less than small imm', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'sltiu', rt: REG.t1, rs: REG.t0, immediate: 0x0005 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('1 when rs is small and imm is large unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 10 },
      { type: 'i_type', op: 'sltiu', rt: REG.t1, rs: REG.t0, immediate: 0xfff0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t1]).toBe(1);
  });
});
