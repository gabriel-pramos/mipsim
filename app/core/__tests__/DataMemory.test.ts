import DataMemory from '../DataMemory';

describe('DataMemory Component', () => {
  let dataMemory: DataMemory;

  beforeEach(() => {
    dataMemory = new DataMemory();
  });

  test('should read 0 from uninitialized address', () => {
    dataMemory.setInput('address', 100);
    dataMemory.setInput('MemRead', 1);
    dataMemory.setInput('MemWrite', 0);
    dataMemory.setInput('MemWidth', 0);
    dataMemory.setInput('LoadUnsigned', 0);

    expect(dataMemory.getOutput('readData')).toBe(0);
  });

  test('should write and read data when MemWrite is enabled', () => {
    dataMemory.setInput('address', 100);
    dataMemory.setInput('writeData', 42);
    dataMemory.setInput('MemWrite', 1);
    dataMemory.setInput('MemWidth', 0);
    dataMemory.commit();

    dataMemory.setInput('MemRead', 1);
    dataMemory.setInput('MemWrite', 0);
    expect(dataMemory.getOutput('readData')).toBe(42);
  });

  test('should not write when MemWrite is disabled', () => {
    dataMemory.setInput('address', 200);
    dataMemory.setInput('writeData', 99);
    dataMemory.setInput('MemWrite', 0);
    dataMemory.commit();

    expect(dataMemory.dataMemory[200 & ~3]).toBeUndefined();
  });
});
