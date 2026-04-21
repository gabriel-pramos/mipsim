import { describe, it, expect } from '@jest/globals';
import { loadFromInstructions, stepN, REG } from '../helpers/processorTestHarness';

describe('li', () => {
  it('small immediate (pseudo expands to addiu $rt, $zero, imm)', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 42 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(42);
  });

  it('large immediate via lui + ori', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'lui', rt: REG.t0, rs: REG.zero, immediate: 0x1234 },
      { type: 'i_type', op: 'ori', rt: REG.t0, rs: REG.t0, immediate: 0x5678 },
    ]);
    stepN(p, 2);
    expect(p.getState().registers[REG.t0]).toBe(0x12345678 >>> 0);
  });

  it('small negative fits in addiu immediate', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: -100 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0] | 0).toBe(-100);
  });

  it('maximum positive 16-bit immediate for addiu', () => {
    const p = loadFromInstructions([
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 32767 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[REG.t0]).toBe(32767);
  });
});
