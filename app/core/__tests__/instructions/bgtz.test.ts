import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('bgtz', () => {
  it('branches when rs > 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'bgtz', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 4 },
    ]);
    stepN(p, 4);
    expect(p.getState().pc).toBe(20);
    expect(p.getState().registers[REG.t2]).toBe(4);
  });

  it('does not branch when rs <= 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'bgtz', rs: REG.t0, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 8 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(8);
  });

  it('does not branch on negative rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -3 },
      { type: 'i_type', op: 'bgtz', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 7 },
    ]);
    stepN(p, 4);
    expect(p.getState().registers[REG.t2]).toBe(7);
  });
});
