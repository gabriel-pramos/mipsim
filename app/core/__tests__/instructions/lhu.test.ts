import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lhu', () => {
  it('loads halfword zero-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x304 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xf0f0 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lhu', rt: REG.t2, base: REG.t0, offset: 2 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0xf0f0);
  });

  it('reads high halfword zero-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x318 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xabcd },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0x1234 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lhu', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 5);
    expect(p.getState().registers[REG.t2]).toBe(0xabcd);
  });
});
