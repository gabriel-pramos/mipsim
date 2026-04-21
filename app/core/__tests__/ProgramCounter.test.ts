import ProgramCounter from '../ProgramCounter';

describe('ProgramCounter Component', () => {
  let pc: ProgramCounter;

  beforeEach(() => {
    pc = new ProgramCounter();
  });

  test('should start at 0', () => {
    expect(pc.PC).toBe(0);
  });

  test('should update PC on clock when input is set', () => {
    pc.setInput('input', 8);
    pc.clock();
    expect(pc.PC).toBe(8);
  });

  test('should reset PC to 0', () => {
    pc.setInput('input', 16);
    pc.clock();
    expect(pc.PC).toBe(16);

    pc.reset();
    expect(pc.PC).toBe(0);
  });
});
