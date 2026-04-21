import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('jr', () => {
  it('jumps to address in rs (byte PC)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 12 },
      { type: 'r_type', op: 'jr', rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 7 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.t2]).toBe(7);
    expect(p.getState().registers[REG.t1]).toBe(0);
  });

  it('jumps to a later word by absolute byte address', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 8 },
      { type: 'r_type', op: 'jr', rs: REG.t0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 5 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(5);
  });
});
