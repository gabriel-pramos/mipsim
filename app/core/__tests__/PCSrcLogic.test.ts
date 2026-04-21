import PCSrcLogic from '../PCSrcLogic';

describe('PCSrcLogic', () => {
  test('beq: branch when zero', () => {
    const g = new PCSrcLogic();
    g.setInput('branch', 1);
    g.setInput('branchNe', 0);
    g.setInput('zero', true);
    expect(g.getOutput('pcSrc')).toBe(1);
  });

  test('beq: no branch when not zero', () => {
    const g = new PCSrcLogic();
    g.setInput('branch', 1);
    g.setInput('branchNe', 0);
    g.setInput('zero', false);
    expect(g.getOutput('pcSrc')).toBe(0);
  });

  test('bne: branch when not zero', () => {
    const g = new PCSrcLogic();
    g.setInput('branch', 1);
    g.setInput('branchNe', 1);
    g.setInput('zero', false);
    expect(g.getOutput('pcSrc')).toBe(1);
  });

  test('bne: no branch when zero', () => {
    const g = new PCSrcLogic();
    g.setInput('branch', 1);
    g.setInput('branchNe', 1);
    g.setInput('zero', true);
    expect(g.getOutput('pcSrc')).toBe(0);
  });
});
