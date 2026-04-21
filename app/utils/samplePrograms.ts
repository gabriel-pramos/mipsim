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
    sw $t1, 0x10($t0)       # master IE (0xFFFF0010 bit 1)

main:
    j main                  # spin until a keyboard IRQ fires`,
  },
  {
    id: 'interrupts',
    name: 'Polled interrupts demo',
    description: 'Software-polled interrupt loop with timer and keyboard handlers, syscall I/O',
    code: `.data

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
    nop`,
  },
];
