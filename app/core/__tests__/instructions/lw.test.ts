import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lw', () => {
  it('loads word from memory', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x100 },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xdead },
      { type: 'i_type', op: 'ori', rt: REG.t1, rs: REG.t1, immediate: 0xbeef },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 5);
    expect(p.getState().registers[REG.t2]).toBe(0xdeadbeef >>> 0);
  });

  it('uses base+offset address', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x200 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 8 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: 8 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(99);
  });

  it('loads zero word', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x40 },
      { type: 'i_type', op: 'sw', rt: REG.zero, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lw', rt: REG.t1, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('negative offset from base', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x210 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x55 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: -16 },
      { type: 'i_type', op: 'lw', rt: REG.t2, base: REG.t0, offset: -16 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0x55);
  });
});
