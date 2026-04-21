import { describe, it, expect, beforeEach } from '@jest/globals';
import { MIPSParser } from '../../../utils/mipsParser';

/** Polling interrupt demo — same layout as `sample_programs.md` (interrupt program block). */
const INTERRUPT_POLL_SAMPLE = `
.data

        msg_main:       .asciiz "Main program running...\\n"
        msg_timer:      .asciiz ">>> Timer interrupt handled! <<<\\n"
        msg_kbd:        .asciiz ">>> Keyboard interrupt handled! <<<\\n"
        msg_done:       .asciiz "Main program finished.\\n"


int_enabled:    .word   0       # 0 = interrupts off, 1 = on
int_pending:    .word   0       # bitmask of pending interrupts
                                #   bit 0 = timer
                                #   bit 1 = keyboard
int_handled:    .word   0       # flag: set to 1 after servicing
counter:        .word   0       # incremented by timer handler

INT_TIMER:      .word   1       # bit 0
INT_KEYBOARD:   .word   2       # bit 1

.text
.globl main

main:
    # Enable interrupts by writing 1 to our virtual register
    la      $t0, int_enabled
    li      $t1, 1
    sw      $t1, 0($t0)

    # Main loop: run 5 iterations, polling for interrupts each pass
    li      $s0, 5              # loop counter

main_loop:
    beq     $s0, $zero, main_done
    nop

    # ---- Poll for pending interrupts ----
    jal     check_interrupts
    nop

    # ---- Do main work ----
    li      $v0, 4
    la      $a0, msg_main
    syscall

    # Simulate some work (delay)
    li      $t2, 50000
delay:
    addi    $t2, $t2, -1
    bne     $t2, $zero, delay
    nop

    addi    $s0, $s0, -1
    j       main_loop
    nop

main_done:
    # Disable interrupts
    la      $t0, int_enabled
    sw      $zero, 0($t0)

    li      $v0, 4
    la      $a0, msg_done
    syscall

    li      $v0, 10
    syscall

check_interrupts:
    addi    $sp, $sp, -4
    sw      $ra, 0($sp)

    # Are interrupts enabled?
    la      $t0, int_enabled
    lw      $t1, 0($t0)
    beq     $t1, $zero, check_done     # not enabled, skip
    nop

    # Read pending flags
    la      $t0, int_pending
    lw      $t1, 0($t0)
    beq     $t1, $zero, check_done     # nothing pending
    nop

    # Check timer bit (bit 0)
    andi    $t2, $t1, 0x0001
    bne     $t2, $zero, dispatch_timer
    nop

    # Check keyboard bit (bit 1)
    andi    $t2, $t1, 0x0002
    bne     $t2, $zero, dispatch_keyboard
    nop

    j       check_done
    nop

dispatch_timer:
    jal     handle_timer
    nop

    # Clear timer bit in pending register
    la      $t0, int_pending
    lw      $t1, 0($t0)
    andi    $t1, $t1, 0xFFFE       # clear bit 0
    sw      $t1, 0($t0)
    j       check_done
    nop

dispatch_keyboard:
    jal     handle_keyboard
    nop

    # Clear keyboard bit in pending register
    la      $t0, int_pending
    lw      $t1, 0($t0)
    andi    $t1, $t1, 0xFFFD       # clear bit 1
    sw      $t1, 0($t0)
    j       check_done
    nop

check_done:
    lw      $ra, 0($sp)
    addi    $sp, $sp, 4
    jr      $ra
    nop

handle_timer:
    # Increment the software counter
    la      $t3, counter
    lw      $t4, 0($t3)
    addi    $t4, $t4, 1
    sw      $t4, 0($t3)

    # Print timer interrupt message
    li      $v0, 4
    la      $a0, msg_timer
    syscall

    jr      $ra
    nop

handle_keyboard:
    li      $v0, 4
    la      $a0, msg_kbd
    syscall

    jr      $ra
    nop
`;

describe('MIPSParser: interrupt polling sample (sample_programs.md)', () => {
  let parser: MIPSParser;

  beforeEach(() => {
    parser = new MIPSParser();
  });

  it('parses and expands the program without error', async () => {
    await expect(parser.processProgram(INTERRUPT_POLL_SAMPLE)).resolves.toBeDefined();
  });

  it('registers all .data labels and lays out strings and .word values', async () => {
    const { symbols, data } = await parser.processProgram(INTERRUPT_POLL_SAMPLE);

    const dataLabels = [
      'msg_main',
      'msg_timer',
      'msg_kbd',
      'msg_done',
      'int_enabled',
      'int_pending',
      'int_handled',
      'counter',
      'INT_TIMER',
      'INT_KEYBOARD',
    ];
    for (const label of dataLabels) {
      expect(symbols.has(label)).toBe(true);
    }

    expect(symbols.get('msg_main')).toBe(0);
    expect(symbols.get('int_enabled')).toBeGreaterThan(symbols.get('msg_done')!);

    expect(data.length).toBeGreaterThan(0);
    expect(data[data.length - 2]).toBe(1);
    expect(data[data.length - 1]).toBe(2);
  });

  it('resolves branches, jumps, and jal so no instruction keeps a string target', async () => {
    const { text } = await parser.processProgram(INTERRUPT_POLL_SAMPLE);

    const exec = text.filter(
      (ins: { type?: string }) =>
        ins &&
        (ins.type === 'r_type' || ins.type === 'i_type' || ins.type === 'j_type' || ins.type === 'special'),
    );

    const stillStringTarget = exec.filter(
      (ins: { target?: unknown }) => typeof ins.target === 'string',
    );
    expect(stillStringTarget).toHaveLength(0);
  });

  it('includes expected text labels after expansion', async () => {
    const { text } = await parser.processProgram(INTERRUPT_POLL_SAMPLE);
    const labels = new Set(
      text.map((ins: { label?: string }) => ins?.label).filter(Boolean) as string[],
    );
    for (const name of [
      'main',
      'main_loop',
      'delay',
      'main_done',
      'check_interrupts',
      'dispatch_timer',
      'dispatch_keyboard',
      'check_done',
      'handle_timer',
      'handle_keyboard',
    ]) {
      expect(labels.has(name)).toBe(true);
    }
  });

  it('produces a stable executable word count for .text', async () => {
    const { userTextWordCount } = await parser.processProgram(INTERRUPT_POLL_SAMPLE);
    expect(userTextWordCount).toBe(88);
  });
});
