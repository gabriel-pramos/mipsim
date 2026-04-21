import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lbu', () => {
  it('loads byte zero-extended', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x404 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0xab },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lbu', rt: REG.t2, base: REG.t0, offset: 3 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0xab);
  });

  it('zero-extends MS byte 0xff', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x50c },
      { type: 'i_type', op: 'lui', rt: REG.t1, rs: REG.zero, immediate: 0xff00 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lbu', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0xff);
  });

  it('reads byte at offset 0 as unsigned', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0x514 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0x01 },
      { type: 'i_type', op: 'sw', rt: REG.t1, base: REG.t0, offset: 0 },
      { type: 'i_type', op: 'lbu', rt: REG.t2, base: REG.t0, offset: 0 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(0);
  });
});
