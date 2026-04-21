import ShiftLeft2 from '../ShiftLeft2';

describe('ShiftLeft2', () => {
  test('shifts sign-extended value left by 2', () => {
    const sl = new ShiftLeft2();
    sl.setInput('signExtended', 0xffff_fff0); // -16 sign-extended from 16-bit
    expect(sl.getOutput('shifted')).toBe(-64);
  });

  test('positive offset', () => {
    const sl = new ShiftLeft2();
    sl.setInput('signExtended', 4);
    expect(sl.getOutput('shifted')).toBe(16);
  });
});
