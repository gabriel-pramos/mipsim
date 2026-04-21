export const ALU_AND = 0b000;
export const ALU_OR = 0b001;
export const ALU_ADD = 0b010;
export const ALU_SUB = 0b110;
export const ALU_SLT = 0b111;
export const ALU_NOR = 0b1000;
export const ALU_XOR = 0b1001;
export const ALU_SLTU = 0b1010;
export const ALU_SLL = 0b1011;
export const ALU_SRL = 0b1100;
export const ALU_SRA = 0b1101;
export const ALU_SLLV = 0b1110;
export const ALU_SRLV = 0b1111;
export const ALU_SRAV = 0b10000;
export const ALU_LUI = 0b10001;
export const ALU_SLTIU = 0b10010;
export const ALU_ANDI = 0b10011;
export const ALU_ORI = 0b10100;
export const ALU_XORI = 0b10101;

/** MARS-style exception / interrupt vector (kseg1). */
export const MIPS_EXCEPTION_VECTOR = 0x80000180;

/** Simulator timer: raise Cause.IP7 (bit 15) every this many steps (edge-triggered). */
export const TIMER_IRQ_PERIOD_STEPS = 12_000;

/** Status: IE (bit 0), EXL (bit 1), IM bits 15:8, UM user mode (bit 4, when EXL=0). */
export const STATUS_IE = 1 << 0;
export const STATUS_EXL = 1 << 1;
export const STATUS_UM = 1 << 4;
