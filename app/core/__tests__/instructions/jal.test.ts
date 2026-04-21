import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('jal', () => {
  it('jumps and sets $ra to PC+4', () => {
    const p = loadFromInstructions([
      { type: 'j_type', op: 'jal', target: 2 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
    ]);
    stepN(p, 3);
    expect(p.getState().registers[REG.t1]).toBe(2);
    expect(p.getState().registers[REG.t0]).toBe(0);
    expect(p.getState().registers[REG.ra]).toBe(4);
  });

  it('$ra points to delay-slot successor of jal', () => {
    const p = loadFromInstructions([
      { type: 'j_type', op: 'jal', target: 3 },
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 0 },
      { type: 'i_type', op: 'addiu', rt: REG.t2, rs: REG.zero, immediate: 1 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.ra]).toBe(4);
    expect(p.getState().registers[REG.t0]).toBe(0);
  });
});
