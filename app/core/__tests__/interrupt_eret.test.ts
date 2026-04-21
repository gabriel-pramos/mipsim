import { describe, it, expect } from '@jest/globals';
import { loadFromUserAndKernel, stepN, REG } from './helpers/processorTestHarness';
import type { Instruction } from '../encoding';
import { MIPS_EXCEPTION_VECTOR } from '../constants';

describe('external interrupt and eret', () => {
  it('delivers interrupt after instruction; eret resumes at EPC', () => {
    const user: Instruction[] = [
      { type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: REG.t1, rs: REG.zero, immediate: 2 },
    ];
    const kernel: Instruction[] = [{ type: 'special', op: 'eret' }];
    const p = loadFromUserAndKernel(user, kernel);
    p.mmio.kbdInterruptEnable = true;
    p.mmio.masterInterruptEnable = true;
    p.enqueueKeyboardAscii('x');

    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(true);
    expect(p.getState().exception.epc).toBe(4);
    expect(p.getState().pc).toBe(MIPS_EXCEPTION_VECTOR);
    expect(p.getState().registers[REG.t0]).toBe(1);

    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(false);
    expect(p.getState().pc).toBe(4);

    stepN(p, 1);
    expect(p.getState().registers[REG.t1]).toBe(2);
  });

  it('does not deliver when master interrupt enable is off', () => {
    const user: Instruction[] = [{ type: 'i_type', op: 'addiu', rt: REG.t0, rs: REG.zero, immediate: 1 }];
    const kernel: Instruction[] = [{ type: 'special', op: 'eret' }];
    const p = loadFromUserAndKernel(user, kernel);
    p.mmio.kbdInterruptEnable = true;
    p.mmio.masterInterruptEnable = false;
    p.enqueueKeyboardAscii('a');

    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(false);
    expect(p.getState().pc).toBe(4);
  });
});
