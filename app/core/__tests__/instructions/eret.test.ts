import { describe, it, expect } from '@jest/globals';
import { STATUS_EXL } from '../../constants';
import { loadFromInstructions, stepN } from '../helpers/processorTestHarness';

describe('eret', () => {
  it('restores PC from EPC and clears EXL', () => {
    const p = loadFromInstructions([
      { type: 'special', op: 'eret' },
    ]);
    p.epc = 0x10;
    p.cp0Status |= STATUS_EXL;
    stepN(p, 1);
    expect(p.getState().pc).toBe(0x10);
    expect(p.getState().exception.exl).toBe(false);
  });

  it('encodes as MIPS eret (0x42000018)', () => {
    const p = loadFromInstructions([{ type: 'special', op: 'eret' }]);
    expect(p.getState().instruction).toBe(0x42000018);
  });
});
