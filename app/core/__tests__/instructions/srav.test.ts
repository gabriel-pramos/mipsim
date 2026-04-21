import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('srav', () => {
  it('arithmetic shift right by low 5 bits of rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 4 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xff00 },
      { type: 'r_type', op: 'srav', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2] | 0).toBe(0xff00 >> 4);
  });

  it('variable shift by 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xff00 },
      { type: 'r_type', op: 'srav', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0xff00);
  });

  it('arithmetic shift propagates sign bit', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 8 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0xff00 },
      { type: 'r_type', op: 'srav', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2] | 0).toBe(-1);
  });
});
