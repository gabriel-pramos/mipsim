import MUX from '../MUX';

describe('MUX Component', () => {
  let mux: MUX;

  beforeEach(() => {
    mux = new MUX();
  });

  test('should select input0 when selector is 0', () => {
    mux.setInput('input0', 10);
    mux.setInput('input1', 20);
    mux.setInput('selector', 0);

    expect(mux.getOutput('output')).toBe(10);
  });

  test('should select input1 when selector is 1', () => {
    mux.setInput('input0', 10);
    mux.setInput('input1', 20);
    mux.setInput('selector', 1);

    expect(mux.getOutput('output')).toBe(20);
  });
});
