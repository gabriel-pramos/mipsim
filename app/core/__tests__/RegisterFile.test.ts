import RegisterFile from '../RegisterFile';

describe('RegisterFile Component', () => {
  let registerFile: RegisterFile;

  beforeEach(() => {
    registerFile = new RegisterFile();
  });

  test('should read from registers', () => {
    registerFile.registers[8] = 1;
    registerFile.registers[9] = 2;
    registerFile.registers[10] = 3;

    registerFile.setInput('readRegister1', 8);
    registerFile.setInput('readRegister2', 9);

    expect(registerFile.getOutput('readData1')).toBe(1);
    expect(registerFile.getOutput('readData2')).toBe(2);

    registerFile.setInput('readRegister1', 10);
    expect(registerFile.getOutput('readData1')).toBe(3);
  });

  test('should write to registers when RegWrite is enabled', () => {
    registerFile.setInput('RegWrite', 1);
    registerFile.setInput('writeData', 123);
    registerFile.setInput('writeRegister', 5);
    registerFile.commit();
    registerFile.setInput('readRegister1', 5);

    expect(registerFile.getOutput('readData1')).toBe(123);
  });

  test('should not write to registers when RegWrite is disabled', () => {
    registerFile.setInput('RegWrite', 1);
    registerFile.setInput('writeData', 123);
    registerFile.setInput('writeRegister', 5);
    registerFile.commit();
    registerFile.setInput('readRegister1', 5);
    expect(registerFile.getOutput('readData1')).toBe(123);

    registerFile.setInput('RegWrite', 0);
    registerFile.setInput('writeData', 321);
    registerFile.setInput('writeRegister', 5);
    registerFile.commit();
    expect(registerFile.getOutput('readData1')).toBe(123);
  });

  test('should not write to register $zero', () => {
    registerFile.setInput('RegWrite', 1);
    registerFile.setInput('writeData', 0x1234);
    registerFile.setInput('writeRegister', 0);
    registerFile.setInput('readRegister1', 0);

    expect(registerFile.getOutput('readData1')).toBe(0);
  });

  test('should return 0 for uninitialized registers', () => {
    registerFile.setInput('readRegister1', 15);
    registerFile.setInput('readRegister2', 20);

    expect(registerFile.getOutput('readData1')).toBe(0);
    expect(registerFile.getOutput('readData2')).toBe(0);
  });

  test('should handle boundary register numbers', () => {
    registerFile.setInput('RegWrite', 1);
    registerFile.setInput('writeData', 0xffff);
    registerFile.setInput('writeRegister', 31);
    registerFile.commit();
    registerFile.setInput('readRegister1', 31);

    expect(registerFile.getOutput('readData1')).toBe(0xffff);
  });
});
