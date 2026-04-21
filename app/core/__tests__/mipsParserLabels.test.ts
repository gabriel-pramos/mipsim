import { describe, test, expect } from '@jest/globals';
import { MIPSParser, KTEXT_LOAD_ADDRESS } from '../../utils/mipsParser';

describe('MIPSParser.resolveBranchAndJumpTargets', () => {
  test('resolves beq label to PC-relative word offset', () => {
    const parser = new MIPSParser();
    const text = [
      { type: 'i_type', op: 'beq', rs: 0, rt: 0, target: 'skip' },
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 2, label: 'skip' },
    ];
    const out = parser.resolveBranchAndJumpTargets(text);
    expect(out[0].immediate).toBe(1);
    expect(out[0].target).toBeUndefined();
  });

  test('throws on undefined label', () => {
    const parser = new MIPSParser();
    const text = [{ type: 'i_type', op: 'beq', rs: 0, rt: 0, target: 'nope' }];
    expect(() => parser.resolveBranchAndJumpTargets(text)).toThrow(/Undefined label/);
  });

  test('resolveBranchAndJumpTargets respects byteBase for .ktext-style addresses', () => {
    const parser = new MIPSParser();
    const base = KTEXT_LOAD_ADDRESS;
    const text = [
      { type: 'i_type', op: 'beq', rs: 0, rt: 0, target: 'skip' },
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 1 },
      { type: 'i_type', op: 'addiu', rt: 8, rs: 0, immediate: 2, label: 'skip' },
    ];
    const out = parser.resolveBranchAndJumpTargets(text, base);
    expect(out[0].immediate).toBe(1);
  });

  test('label on li pseudo is kept on first expanded instruction for branch resolution', () => {
    const parser = new MIPSParser();
    const text = [
      { type: 'i_type', op: 'beq', rs: 0, rt: 0, target: 'b' },
      {
        type: 'pseudo',
        op: 'li',
        id: 1,
        rt: 8,
        immediate: 1,
        label: 'b',
      },
    ];
    const expanded = parser.expandPseudoInstructions(text);
    expect(expanded[1].label).toBe('b');
    const out = parser.resolveBranchAndJumpTargets(expanded);
    expect(out[0].immediate).toBe(0);
  });
});
