import { Processor } from '../Processor';
import type { Instruction } from '../encoding';

describe('Processor branch datapath', () => {
  test('beq branches using PC+4 + (imm << 2)', () => {
    const instructions: Instruction[] = [
      { type: 'i_type', op: 'beq', rs: 0, rt: 0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 9, rs: 0, immediate: 42 },
    ];
    const p = new Processor(instructions);
    p.reset();
    p.step();
    expect(p.getState().pc).toBe(8);
  });

  test('bne branches when registers differ', () => {
    const instructions: Instruction[] = [
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 9, rs: 0, immediate: 2 },
      { type: 'i_type', op: 'bne', rs: 8, rt: 9, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 10, rs: 0, immediate: 99 },
      { type: 'i_type', op: 'addiu', rt: 11, rs: 0, immediate: 7 },
    ];
    const p = new Processor(instructions);
    p.reset();
    p.step();
    p.step();
    p.step();
    expect(p.getState().pc).toBe(16);
  });
});
