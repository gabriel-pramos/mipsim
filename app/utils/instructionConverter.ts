import { registerNameToNumber } from './registerMap';

export interface ParsedInstruction {
  id?: number;
  type: string;
  op: string;
  rd?: number | string;
  rs?: number | string;
  rt?: number | string;
  shamt?: number;
  immediate?: number;
  target?: string | number;
  base?: number | string;
  offset?: number;
  label?: string;
}

export interface NormalizedInstruction {
  id: number;
  type: string;
  op: string;
  rd?: number;
  rs?: number;
  rt?: number;
  shamt?: number;
  immediate?: number;
  target?: string | number;
  base?: number;
  offset?: number;
  label?: string;
}

export function convertRegisterField(field: number | string | undefined): number {
  if (field === undefined) return 0;
  if (typeof field === 'number') return field;
  return registerNameToNumber(field);
}

export function normalizeInstructions(instructions: ParsedInstruction[]): NormalizedInstruction[] {
  return instructions.map((instr, index) => {
    const normalized: NormalizedInstruction = {
      id: instr.id !== undefined ? instr.id : index,
      type: instr.type,
      op: instr.op,
      label: instr.label,
    };

    // Convert register fields to numbers
    if (instr.rd !== undefined) {
      normalized.rd = convertRegisterField(instr.rd);
    }
    if (instr.rs !== undefined) {
      normalized.rs = convertRegisterField(instr.rs);
    }
    if (instr.rt !== undefined) {
      normalized.rt = convertRegisterField(instr.rt);
    }
    if (instr.base !== undefined) {
      normalized.base = convertRegisterField(instr.base);
    }

    // Copy other fields
    if (instr.shamt !== undefined) normalized.shamt = instr.shamt;
    if (instr.immediate !== undefined) normalized.immediate = instr.immediate;
    if (instr.target !== undefined) normalized.target = instr.target;
    if (instr.offset !== undefined) normalized.offset = instr.offset;

    return normalized;
  });
}

// Expand pseudo-instructions into real MIPS instructions
export function expandPseudoInstructions(instructions: NormalizedInstruction[]): NormalizedInstruction[] {
  const expanded: NormalizedInstruction[] = [];
  let idCounter = 0;

  for (const instr of instructions) {
    if (instr.type === 'pseudo') {
      switch (instr.op) {
        case 'li': // Load immediate
          // li $rt, imm -> addiu $rt, $zero, imm (or lui + ori for large values)
          const immediate = instr.immediate || 0;
          if (immediate >= -32768 && immediate <= 32767) {
            // Small immediate: addiu $rt, $zero, imm
            expanded.push({
              id: idCounter++,
              type: 'i_type',
              op: 'addiu',
              rt: instr.rt,
              rs: 0, // $zero
              immediate: immediate,
            });
          } else {
            // Large immediate: lui + ori
            const upper = (immediate >> 16) & 0xFFFF;
            const lower = immediate & 0xFFFF;
            expanded.push({
              id: idCounter++,
              type: 'i_type',
              op: 'lui',
              rt: instr.rt,
              immediate: upper,
            });
            if (lower !== 0) {
              expanded.push({
                id: idCounter++,
                type: 'i_type',
                op: 'ori',
                rt: instr.rt,
                rs: instr.rt,
                immediate: lower,
              });
            }
          }
          break;

        case 'la': // Load address
          // Similar to li, but for addresses
          expanded.push({
            id: idCounter++,
            type: 'i_type',
            op: 'addiu',
            rt: instr.rt,
            rs: 0,
            immediate: instr.immediate || 0,
          });
          break;

        case 'move': // Move register
          // move $rd, $rs -> addu $rd, $rs, $zero
          expanded.push({
            id: idCounter++,
            type: 'r_type',
            op: 'addu',
            rd: instr.rd,
            rs: instr.rs,
            rt: 0, // $zero
          });
          break;

        default:
          expanded.push({ ...instr, id: idCounter++ });
      }
    } else if (instr.type === 'globl' || instr.op === 'globl') {
      // Skip .globl directives
      continue;
    } else {
      expanded.push({ ...instr, id: idCounter++ });
    }
  }

  return expanded;
}

