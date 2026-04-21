import { describe, it, expect } from '@jest/globals';
import { encodeInstruction } from '../../encoding';
import type { Instruction } from '../../encoding';
import { loadFromInstructions, stepN } from '../helpers/processorTestHarness';
import { MIPS_EXCEPTION_VECTOR, STATUS_IE, STATUS_UM } from '../../constants';

describe('COP0 mfc0 / mtc0', () => {
  it('encodes mfc0 and mtc0 like MIPS32', () => {
    const mfc0: Instruction = { type: 'cop0_type', op: 'mfc0', rt: 8, rd: 12 };
    expect(encodeInstruction(mfc0)).toBe(0x40086000 >>> 0);
    const mtc0: Instruction = { type: 'cop0_type', op: 'mtc0', rt: 9, rd: 13 };
    expect(encodeInstruction(mtc0)).toBe(0x40896800 >>> 0);
  });

  it('mfc0 reads Status default UM; mtc0 writes EPC', () => {
    const p = loadFromInstructions([
      { type: 'cop0_type', op: 'mfc0', rt: 8, rd: 12 },
      { type: 'i_type', op: 'addiu', rt: 9, rs: 0, immediate: 0x20 },
      { type: 'cop0_type', op: 'mtc0', rt: 9, rd: 14 },
      { type: 'cop0_type', op: 'mfc0', rt: 10, rd: 14 },
    ]);
    stepN(p, 1);
    expect(p.getState().registers[8]).toBe(STATUS_UM >>> 0);
    stepN(p, 3);
    expect(p.getState().registers[10]).toBe(0x20);
    expect(p.epc).toBe(0x20);
  });

  it('CP0 interrupt path vectors to 0x80000180 when IE, IM, and Cause IP match', () => {
    const p = loadFromInstructions([{ type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 1 }]);
    p.cp0Status = STATUS_UM | STATUS_IE | 0xff00;
    p.cp0Cause = 0x8000;
    stepN(p, 1);
    expect(p.getState().exception.exl).toBe(true);
    expect(p.getState().pc >>> 0).toBe(MIPS_EXCEPTION_VECTOR >>> 0);
  });
});
