import AND from '../AND';

describe('AND Component', () => {
  let andGate: AND;

  beforeEach(() => {
    andGate = new AND();
  });

  test('should output 1 when both inputs are truthy', () => {
    andGate.setInput('input1', 1);
    andGate.setInput('input2', 1);
    expect(andGate.getOutput('output')).toBe(1);
  });

  test('should output 0 when one input is falsy', () => {
    andGate.setInput('input1', 1);
    andGate.setInput('input2', 0);
    expect(andGate.getOutput('output')).toBe(0);
  });

  test('should output 0 when both inputs are falsy', () => {
    andGate.setInput('input1', 0);
    andGate.setInput('input2', 0);
    expect(andGate.getOutput('output')).toBe(0);
  });
});
