import { describe, it, expect } from '@jest/globals';
import { MmioController } from '../MmioController';

describe('MmioController', () => {
  it('writeMem word to display appends ASCII', () => {
    const m = new MmioController();
    m.writeMem(0xffff000c, 0x58, 0);
    expect(m.getTerminalOutput()).toBe('X');
  });
});
