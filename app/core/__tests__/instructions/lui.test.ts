import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('lui', () => {
  it('loads immediate into upper half of rt', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0x1234 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0x12340000 >>> 0);
  });

  it('combines with ori for full 32-bit constant', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xabcd },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0xef01 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0xabcdef01 >>> 0);
  });

  it('immediate 0xffff loads 0xffff0000', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0xffff },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0xffff0000 >>> 0);
  });

  it('overwrites full register (clears lower half until ori)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0xabcd },
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0x1111 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x11110000 >>> 0);
  });
});
