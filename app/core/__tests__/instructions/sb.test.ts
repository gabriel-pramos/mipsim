import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sb', () => {
  it('stores low byte', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x700 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xaabbccdd },
      { type: 'i_type', op: 'sb', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().dataMemoryContents[0x700]).toBeDefined();
  });

  it('stores low byte at non-zero offset within word', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x710 },
      { type: 'i_type', op: 'sw', rt: REG.zero, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.zero, immediate: 0xef },
      { type: 'i_type', op: 'sb', rt: REG.t1, base: REG.t0, offset: 2 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 5);
    expect((p.getState().registers[REG.t2] >>> 8) & 0xff).toBe(0xef);
  });

  it('only affects one byte in the word', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x720 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0x1122 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0x3344 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'ori', rt: REG.t2, rs: REG.zero, immediate: 0xff },
      { type: 'i_type', op: 'sb', rt: REG.t2, base: REG.t0, offset: 3 },
      { type: 'i_type', op: 'lw', rt: REG.t3, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 7);
    expect(p.getState().registers[REG.t3]).toBe(0x112233ff >>> 0);
  });
});
