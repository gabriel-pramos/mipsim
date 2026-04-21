import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('la', () => {
  it('loads address 0 (upper 0, no ori when low half is 0)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0);
  });

  it('loads numeric address 0x2000 (lui + ori)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0x2000 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x2000);
  });

  it('high half from lui only', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0x8000 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(0x80000000 >>> 0);
  });

  it('full address with non-zero upper and lower', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0x0040 },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0x00c0 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x004000c0);
  });
});
