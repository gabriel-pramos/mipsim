import ALU from '../ALU';

describe('ALU Component', () => {
  let alu: ALU;

  beforeEach(() => {
    alu = new ALU();
  });

  test('should perform AND operation', () => {
    alu.setInput('readData1', 0b1100);
    alu.setInput('readData2', 0b1010);
    alu.setInput('ALUOp', 0b000);

    expect(alu.getOutput('result')).toBe(0b1000);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should perform OR operation', () => {
    alu.setInput('readData1', 0b1100);
    alu.setInput('readData2', 0b1010);
    alu.setInput('ALUOp', 0b001);

    expect(alu.getOutput('result')).toBe(0b1110);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should perform ADD operation', () => {
    alu.setInput('readData1', 15);
    alu.setInput('readData2', 25);
    alu.setInput('ALUOp', 0b010);

    expect(alu.getOutput('result')).toBe(40);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should perform SUB operation', () => {
    alu.setInput('readData1', 50);
    alu.setInput('readData2', 30);
    alu.setInput('ALUOp', 0b110);

    expect(alu.getOutput('result')).toBe(20);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should perform SLT when first operand is less', () => {
    alu.setInput('readData1', 10);
    alu.setInput('readData2', 20);
    alu.setInput('ALUOp', 0b111);

    expect(alu.getOutput('result')).toBe(1);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should perform SLT when first operand is greater', () => {
    alu.setInput('readData1', 30);
    alu.setInput('readData2', 20);
    alu.setInput('ALUOp', 0b111);

    expect(alu.getOutput('result')).toBe(0);
    expect(alu.getOutput('zero')).toBe(true);
  });

  test('should set zero flag when result is zero (SUB)', () => {
    alu.setInput('readData1', 25);
    alu.setInput('readData2', 25);
    alu.setInput('ALUOp', 0b110);

    expect(alu.getOutput('result')).toBe(0);
    expect(alu.getOutput('zero')).toBe(true);
  });

  test('should default to ADD for unknown opcode', () => {
    alu.setInput('readData1', 10);
    alu.setInput('readData2', 5);
    alu.setInput('ALUOp', 0b100);

    expect(alu.getOutput('result')).toBe(15);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should handle negative numbers in SUB', () => {
    alu.setInput('readData1', 10);
    alu.setInput('readData2', 20);
    alu.setInput('ALUOp', 0b110);
    alu.setInput('shamt', 0);

    expect(alu.getOutput('result')).toBe((10 - 20) >>> 0);
    expect(alu.getOutput('zero')).toBe(false);
  });

  test('should handle zero inputs', () => {
    alu.setInput('readData1', 0);
    alu.setInput('readData2', 0);
    alu.setInput('ALUOp', 0b010);

    expect(alu.getOutput('result')).toBe(0);
    expect(alu.getOutput('zero')).toBe(true);
  });
});
