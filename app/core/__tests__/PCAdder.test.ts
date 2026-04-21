import PCAdder from '../PCAdder';

describe('PCAdder Component', () => {
  let pcAdder: PCAdder;

  beforeEach(() => {
    pcAdder = new PCAdder();
  });

  test('should add 4 to input', () => {
    pcAdder.setInput('PC', 0);
    expect(pcAdder.getOutput('nextPC')).toBe(4);
  });

  test('should add 4 to non-zero PC', () => {
    pcAdder.setInput('PC', 16);
    expect(pcAdder.getOutput('nextPC')).toBe(20);
  });
});
