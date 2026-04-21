import ControlUnit from '../ControlUnit';

describe('ControlUnit Component', () => {
  let controlUnit: ControlUnit;

  beforeEach(() => {
    controlUnit = new ControlUnit();
  });

  test('should generate control signals for R-type add', () => {
    const instruction = (0x00 << 26) | 0x20;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(1);
    expect(controlUnit.getOutput('ALUSrc')).toBe(0);
    expect(controlUnit.getOutput('MemToReg')).toBe(0);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('MemRead')).toBe(0);
    expect(controlUnit.getOutput('MemWrite')).toBe(0);
    expect(controlUnit.getOutput('Branch')).toBe(0);
    expect(controlUnit.getOutput('Jump')).toBe(0);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b010);
  });

  test('should generate control signals for R-type sub', () => {
    const instruction = (0x00 << 26) | 0x22;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b110);
  });

  test('should generate control signals for R-type and', () => {
    const instruction = (0x00 << 26) | 0x24;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b000);
  });

  test('should generate control signals for R-type or', () => {
    const instruction = (0x00 << 26) | 0x25;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b001);
  });

  test('should generate control signals for R-type slt', () => {
    const instruction = (0x00 << 26) | 0x2a;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b111);
  });

  test('should generate control signals for lw', () => {
    const instruction = 0x23 << 26;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('RegDst')).toBe(0);
    expect(controlUnit.getOutput('ALUSrc')).toBe(1);
    expect(controlUnit.getOutput('MemToReg')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('MemRead')).toBe(1);
    expect(controlUnit.getOutput('MemWrite')).toBe(0);
    expect(controlUnit.getOutput('Branch')).toBe(0);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b010);
  });

  test('should generate control signals for sw', () => {
    const instruction = 0x2b << 26;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('ALUSrc')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(0);
    expect(controlUnit.getOutput('MemWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b010);
  });

  test('should generate control signals for beq', () => {
    const instruction = 0x04 << 26;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('Branch')).toBe(1);
    expect(controlUnit.getOutput('BranchNe')).toBe(0);
    expect(controlUnit.getOutput('RegWrite')).toBe(0);
    expect(controlUnit.getOutput('MemWrite')).toBe(0);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b110);
  });

  test('should set BranchNe for bne', () => {
    const instruction = 0x05 << 26;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('Branch')).toBe(1);
    expect(controlUnit.getOutput('BranchNe')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b110);
  });

  test('should generate control signals for addi', () => {
    const instruction = 0x08 << 26;
    controlUnit.setInput('instruction', instruction);

    expect(controlUnit.getOutput('ALUSrc')).toBe(1);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('ALUOp')).toBe(0b010);
  });

  test('should update outputs when instruction changes', () => {
    let instruction = (0x00 << 26) | 0x20;
    controlUnit.setInput('instruction', instruction);
    expect(controlUnit.getOutput('RegWrite')).toBe(1);
    expect(controlUnit.getOutput('MemWrite')).toBe(0);

    instruction = 0x2b << 26;
    controlUnit.setInput('instruction', instruction);
    expect(controlUnit.getOutput('RegWrite')).toBe(0);
    expect(controlUnit.getOutput('MemWrite')).toBe(1);
  });
});
