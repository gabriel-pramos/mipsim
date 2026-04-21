import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('srlv', () => {
  it('logical shift right by low 5 bits of rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x14 },
      { type: 'r_type', op: 'srlv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(5);
  });

  it('shift by 0 from rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x20 },
      { type: 'r_type', op: 'srlv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0x20);
  });

  it('masks rs to 5 bits for shift count', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 34 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x18 },
      { type: 'r_type', op: 'srlv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(6);
  });
});
