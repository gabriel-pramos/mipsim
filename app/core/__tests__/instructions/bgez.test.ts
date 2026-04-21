import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('bgez', () => {
  it('branches when rs >= 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'bgez', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 5 },
    ]);
    stepN(p, 3);
    expect(p.getState().pc).toBe(16);
    expect(p.getState().registers[REG.t2]).toBe(5);
  });

  it('does not branch when rs < 0', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -3 },
      { type: 'i_type', op: 'bgez', rs: REG.t0, immediate: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(2);
  });

  it('branches on positive rs', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 42 },
      { type: 'i_type', op: 'bgez', rs: REG.t0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 3 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t2]).toBe(3);
  });
});
