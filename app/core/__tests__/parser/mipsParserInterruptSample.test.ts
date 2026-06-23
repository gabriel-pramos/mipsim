import { describe, it, expect, beforeEach } from '@jest/globals';
import { MIPSParser } from '../../../utils/mipsParser';
import { normalizeInstructions } from '../../../utils/instructionConverter';
import { SAMPLE_PROGRAMS } from '../../../utils/samplePrograms';
import { Processor } from '../../Processor';
import type { Instruction } from '../../encoding';
import { REG, stepN } from '../helpers/processorTestHarness';

/** The "Timer + keyboard interrupts" sample, exactly as shipped to the editor. */
const INTERRUPT_SAMPLE = SAMPLE_PROGRAMS.find((s) => s.id === 'interrupts')!.code;

/** Mirror the editor load path: parse → normalize register names → load user + kernel + data. */
async function loadSample(code: string) {
  const parser = new MIPSParser();
  const result = await parser.processProgram(code + '\n');

  const map = new Map<number, Instruction>();
  for (const [wi, ins] of result.instructionWordMap as Map<number, unknown>) {
    const [one] = normalizeInstructions([ins as never]);
    map.set(wi, one as Instruction);
  }

  const p = new Processor();
  p.loadInstructionMap(map, result.userTextWordCount);
  p.loadDataSegment(parser.data);
  return { p, parser, result };
}

describe('MIPSParser: timer + keyboard interrupt sample', () => {
  let parser: MIPSParser;

  beforeEach(() => {
    parser = new MIPSParser();
  });

  it('parses and expands the program without error', async () => {
    await expect(parser.processProgram(INTERRUPT_SAMPLE)).resolves.toBeDefined();
  });

  it('registers all .data string labels with msg_banner at offset 0', async () => {
    const { symbols } = await parser.processProgram(INTERRUPT_SAMPLE);
    for (const label of ['msg_banner', 'msg_kbd', 'msg_nl', 'msg_timer']) {
      expect(symbols.has(label)).toBe(true);
    }
    expect(symbols.get('msg_banner')).toBe(0);
  });

  it('decodes \\n escapes in .asciiz into real newline bytes', async () => {
    const { data } = await parser.processProgram(INTERRUPT_SAMPLE);
    expect(data).toContain(0x0a);
    // The standalone "\n" string is one newline byte + null terminator, never the literal chars.
    expect(data).not.toContain('\\'.charCodeAt(0));
  });

  it('resolves every branch/jump target (no instruction keeps a string target)', async () => {
    const { instructionWordMap } = await parser.processProgram(INTERRUPT_SAMPLE);
    const stillString = [...instructionWordMap.values()].filter(
      (ins: { target?: unknown }) => typeof ins.target === 'string',
    );
    expect(stillString).toHaveLength(0);
  });

  it('includes expected user and kernel text labels', async () => {
    const { instructionWordMap } = await parser.processProgram(INTERRUPT_SAMPLE);
    const labels = new Set(
      [...instructionWordMap.values()]
        .map((ins: { label?: string }) => ins?.label)
        .filter(Boolean) as string[],
    );
    for (const name of ['main', 'idle', 'irq_handler', 'irq_kbd', 'irq_timer']) {
      expect(labels.has(name)).toBe(true);
    }
  });

  it('lays the interrupt handler at the 0x80000180 exception vector', async () => {
    const { instructionWordMap } = await parser.processProgram(INTERRUPT_SAMPLE);
    const vectorWord = (0x80000180 >>> 2) >>> 0;
    expect(instructionWordMap.has(vectorWord)).toBe(true);
    expect(instructionWordMap.get(vectorWord)?.op).toBe('mfc0');
  });

  it('echoes a typed key via a real keyboard interrupt', async () => {
    const { p } = await loadSample(INTERRUPT_SAMPLE);

    // Run setup + banner, then settle into the idle loop.
    stepN(p, 20);
    expect(p.getState().terminalOutput).toContain('Interrupts enabled');

    // A keystroke raises the keyboard IRQ; the ISR echoes it on the next steps.
    p.enqueueKeyboardAscii('A');
    stepN(p, 30);

    expect(p.getState().terminalOutput).toContain('Key IRQ -> A');
  });

  it('takes a timer interrupt (IP7) and bumps the $s0 tick counter', async () => {
    const { p } = await loadSample(INTERRUPT_SAMPLE);

    // The timer edge fires every TIMER_IRQ_PERIOD_STEPS (12,000) steps.
    stepN(p, 12_200);

    expect(p.getState().registers[REG.s0]).toBeGreaterThanOrEqual(1);
    expect(p.getState().terminalOutput).toContain('Timer IRQ');
  });
});
