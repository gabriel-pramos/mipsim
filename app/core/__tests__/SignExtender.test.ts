import SignExtender from '../SignExtender';

describe('SignExtender Component', () => {
  let signExtender: SignExtender;

  beforeEach(() => {
    signExtender = new SignExtender();
  });

  test('should extend positive 16-bit value', () => {
    signExtender.setInput('immediate', 0x7fff);
    expect(signExtender.getOutput('signExtended')).toBe(0x7fff);
  });

  test('should sign-extend negative 16-bit value', () => {
    signExtender.setInput('immediate', 0x8000);
    expect(signExtender.getOutput('signExtended')).toBe(0xffff8000 | 0);
  });

  test('should handle zero', () => {
    signExtender.setInput('immediate', 0);
    expect(signExtender.getOutput('signExtended')).toBe(0);
  });
});
