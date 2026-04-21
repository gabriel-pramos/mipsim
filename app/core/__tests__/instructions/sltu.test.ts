import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sltu', () => {
  it('sets rd to 1 when rs < rt unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'r_type', op: 'sltu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(1);
  });

  it('treats large values as unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'sltu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });

  it('0 when rs == rt unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 7 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 7 },
      { type: 'r_type', op: 'sltu', rd: REG.t2, rs: REG.t0, rt: REG.t1 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });

  it('1 when comparing 0 to 1', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'r_type', op: 'sltu', rd: REG.t0, rs: REG.zero, rt: REG.t1 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(1);
  });
});
