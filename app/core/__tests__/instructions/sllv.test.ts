import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sllv', () => {
  it('shift left by low 5 bits of rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'sllv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(8);
  });

  it('uses only low 5 bits of shift amount', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 35 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'sllv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(8);
  });

  it('shift by 0 from rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x0f },
      { type: 'r_type', op: 'sllv', rd: REG.t2, rt: REG.t1, rs: REG.t0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0x0f);
  });
});
