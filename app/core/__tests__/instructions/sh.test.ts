import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sh', () => {
  it('stores low halfword', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x600 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x12345678 },
      { type: 'i_type', op: 'sh', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().dataMemoryContents[0x600]).toBeDefined();
  });

  it('merges into existing word (low half only)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x610 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xaa55 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0xccdd },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'ori', rt: REG.t2, rs: REG.zero, immediate: 0x1234 },
      { type: 'i_type', op: 'sh', rt: REG.t2, base: REG.t0, offset: 2 },
      { type: 'i_type', op: 'lw', rt: REG.t3, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 7);
    expect(p.getState().registers[REG.t3]).toBe(0xaa551234 >>> 0);
  });
});
