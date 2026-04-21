import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('sw', () => {
  it('stores word to memory', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x500 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0x1122 },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0x3344 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().dataMemoryContents[0x500]).toBe(0x11223344 >>> 0);
  });

  it('uses base+offset', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x500 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x55 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 4 },
    ]);
    stepN(p, 3);
    expect(p.getState().dataMemoryContents[0x504]).toBe(0x55);
  });

  it('stores zero word', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x510 },
      { type: 'i_type', op: 'sw', rt: REG.zero, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 2);
    expect(p.getState().dataMemoryContents[0x510 & ~3]).toBe(0);
  });

  it('overwrites previous word at same address', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x520 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 5);
    expect(p.getState().dataMemoryContents[0x520 & ~3]).toBe(2);
  });
});
