export interface SampleProgram {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    id: 'square',
    name: 'Square function',
    description: 'Computes square(7) using a jal subroutine call',
    code: `.text
.globl main

main:
        addiu $sp, $zero, 0x1800   # stack (simulator starts $sp at 0)
        li      $a0, 7
        jal     square
        j       done

# square(n) — argument $a0, returns $v0 = n*n
square:
        mul     $v0, $a0, $a0
        jr      $ra

done:
        j       done`,
  },
  {
    id: 'factorial',
    name: 'Factorial (recursive)',
    description: 'Computes factorial(6) with recursive jal calls and stack frames',
    code: `.text
.globl main

main:
        addiu $sp, $zero, 0x1800
        li      $a0, 6
        jal     factorial
        j       done

# factorial(n): $a0 = n, returns $v0 = n!
factorial:
        addi  $sp, $sp, -8
        sw    $ra, 4($sp)
        sw    $a0, 0($sp)
        li    $t0, 1
        slt   $t1, $t0, $a0       # $t1 = 1 if n > 1
        beq   $t1, $zero, base_case

        addi  $a0, $a0, -1
        jal   factorial
        lw    $a0, 0($sp)
        mul   $v0, $a0, $v0
        lw    $ra, 4($sp)
        addi  $sp, $sp, 8
        jr    $ra

base_case:
        li    $v0, 1
        lw    $ra, 4($sp)
        addi  $sp, $sp, 8
        jr    $ra

done:
        j     done`,
  },
  {
    id: 'keyboard',
    name: 'Keyboard interrupt',
    description: 'Echoes keyboard input to the display via hardware interrupt and MMIO',
    code: `.ktext
handler:
    lui $t2, 0xffff
    lw $t3, 4($t2)          # read keyboard (0xFFFF0004)
    sw $t3, 0xc($t2)        # echo to display (0xFFFF000C)
    eret

.text
.globl main
    j setup

setup:
    lui $t0, 0xffff
    ori $t1, $zero, 1
    sw $t1, 0($t0)          # keyboard interrupt enable (0xFFFF0000 bit 0)
    sw $t1, 0x10($t0)       # master IE (0xFFFF0010 bit 0)
    ori $t1, $zero, 0x0101   # IE + IM[0] (keyboard IRQ)
    mtc0 $t1, $12            # Status

main:
    j main                  # spin until a keyboard IRQ fires`,
  },
  {
    id: 'interrupts',
    name: 'Timer + keyboard interrupts',
    description: 'Real hardware interrupts: enables COP0/MMIO, handles timer (IP7) and keyboard IRQs at the 0x80000180 vector',
    code: `.data
msg_banner:  .asciiz "Interrupts enabled. Type a key; timer ticks in the background.\\n"
msg_kbd:     .asciiz "Key IRQ -> "
msg_nl:      .asciiz "\\n"
msg_timer:   .asciiz ">>> Timer IRQ ($s0 = tick count) <<<\\n"

.text
.globl main

main:
    # ---- Enable MARS-style hardware interrupts ----
    lui     $t0, 0xffff          # MMIO base = 0xFFFF0000
    ori     $t1, $zero, 1
    sw      $t1, 0($t0)          # keyboard control: IRQ enable   (0xFFFF0000)
    sw      $t1, 0x10($t0)       # sim status: master IRQ enable   (0xFFFF0010)

    ori     $t1, $zero, 0x8101   # Status: IE | IM1 (keyboard) | IM7 (timer)
    mtc0    $t1, $12             # write CP0 Status (register 12)

    li      $s0, 0               # $s0 = timer tick counter (bumped by the ISR)

    li      $v0, 4               # print the banner once
    la      $a0, msg_banner
    syscall

idle:
    j       idle                 # spin forever; the handler runs on each IRQ

.ktext 0x80000180
# Single entry point for every interrupt. $k0/$k1 are scratch; we deliberately
# clobber $v0/$a0 (for syscall output) and $s0 (the tick counter) — the idle
# loop never reads them, so saving/restoring is omitted to keep the demo short.
irq_handler:
    mfc0    $k0, $13             # read CP0 Cause
    nop                          # CP0 read hazard: result is usable one slot later
    andi    $k1, $k0, 0x8000     # IP7 set => this was a timer interrupt
    bne     $k1, $zero, irq_timer
    nop

irq_kbd:                         # keyboard interrupt: echo the typed key
    lui     $k0, 0xffff
    lw      $k1, 4($k0)          # consume the key byte (0xFFFF0004)
    li      $v0, 4
    la      $a0, msg_kbd
    syscall
    sw      $k1, 0xc($k0)        # echo the key to the display (0xFFFF000C)
    li      $v0, 4
    la      $a0, msg_nl
    syscall
    eret

irq_timer:                       # timer interrupt: bump and report the counter
    addi    $s0, $s0, 1
    li      $v0, 4
    la      $a0, msg_timer
    syscall
    eret`,
  },
];
