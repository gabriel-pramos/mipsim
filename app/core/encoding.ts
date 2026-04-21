export interface Instruction {
  id?: number;
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

const OPCODE_MAP: Record<string, number> = {
  add: 0x00, addu: 0x00, sub: 0x00, subu: 0x00,
  and: 0x00, or: 0x00, xor: 0x00, nor: 0x00,
  slt: 0x00, sltu: 0x00,
  sll: 0x00, srl: 0x00, sra: 0x00,
  sllv: 0x00, srlv: 0x00, srav: 0x00,
  jr: 0x00, jalr: 0x00,
  mfhi: 0x00, mflo: 0x00,
  mult: 0x00, multu: 0x00, div: 0x00, divu: 0x00,
  addi: 0x08, addiu: 0x09,
  andi: 0x0c, ori: 0x0d, xori: 0x0e,
  slti: 0x0a, sltiu: 0x0b,
  lui: 0x0f,
  beq: 0x04, bne: 0x05,
  blez: 0x06, bgtz: 0x07,
  lw: 0x23, lh: 0x21, lhu: 0x25, lb: 0x20, lbu: 0x24,
  sw: 0x2b, sh: 0x29, sb: 0x28,
  j: 0x02, jal: 0x03,
  bgez: 0x01, bgezal: 0x01, bltz: 0x01, bltzal: 0x01,
};

/** MIPS REGIMM: opcode 1; `rt` selects the branch variant. */
const REGIMM_RT: Record<string, number> = {
  bltz: 0x00,
  bgez: 0x01,
  bltzal: 0x10,
  bgezal: 0x11,
};

const FUNCT_MAP: Record<string, number> = {
  add: 0x20, addu: 0x21, sub: 0x22, subu: 0x23,
  and: 0x24, or: 0x25, xor: 0x26, nor: 0x27,
  slt: 0x2a, sltu: 0x2b,
  sll: 0x00, srl: 0x02, sra: 0x03,
  sllv: 0x04, srlv: 0x06, srav: 0x07,
  jr: 0x08, jalr: 0x09,
  mfhi: 0x10, mthi: 0x11, mflo: 0x12, mtlo: 0x13,
  /** Simulator-specific funct (not MIPS-I `mul`); 3-operand multiply low word. */
  mul: 0x1c,
  mult: 0x18, multu: 0x19, div: 0x1a, divu: 0x1b,
  syscall: 0x0c,
};

export function encodeInstruction(instr: Instruction): number {
  const op = instr.op.toLowerCase();
  if (op === 'eret') {
    return 0x42000018;
  }
  if (op === 'mfc0' || op === 'mtc0') {
    const rt = instr.rt ?? 0;
    const rd = instr.rd ?? 0;
    const base = op === 'mfc0' ? 0x40000000 : 0x40800000;
    return (base | ((rt & 0x1f) << 16) | ((rd & 0x1f) << 11)) >>> 0;
  }
  const opcode = OPCODE_MAP[op] ?? 0;

  if (instr.type === 'r_type' || opcode === 0x00) {
    const rs = instr.rs ?? 0;
    const rt = instr.rt ?? 0;
    const rd = instr.rd ?? 0;
    const shamt = instr.shamt ?? 0;
    const funct = FUNCT_MAP[op] ?? 0;
    return (
      ((opcode & 0x3f) << 26) |
      ((rs & 0x1f) << 21) |
      ((rt & 0x1f) << 16) |
      ((rd & 0x1f) << 11) |
      ((shamt & 0x1f) << 6) |
      (funct & 0x3f)
    );
  }

  if (instr.type === 'j_type') {
    const target = typeof instr.target === 'number' ? instr.target : 0;
    return ((opcode & 0x3f) << 26) | (target & 0x03ffffff);
  }

  // I-type
  const rs = instr.rs ?? instr.base ?? 0;
  let rt = instr.rt ?? 0;
  const imm = instr.immediate ?? instr.offset ?? 0;
  const regimmRt = REGIMM_RT[op];
  if (regimmRt !== undefined) {
    rt = regimmRt;
  }
  return (
    ((opcode & 0x3f) << 26) |
    ((rs & 0x1f) << 21) |
    ((rt & 0x1f) << 16) |
    (imm & 0xffff)
  );
}

export function decodeInstruction(encoded: number) {
  const opcode = (encoded >>> 26) & 0x3f;
  const rs = (encoded >>> 21) & 0x1f;
  const rt = (encoded >>> 16) & 0x1f;
  const rd = (encoded >>> 11) & 0x1f;
  const shamt = (encoded >>> 6) & 0x1f;
  const funct = encoded & 0x3f;
  const immediate = encoded & 0xffff;
  const signedImmediate = immediate & 0x8000 ? immediate | 0xffff0000 : immediate;
  const target = encoded & 0x03ffffff;

  return { opcode, rs, rt, rd, shamt, funct, immediate, signedImmediate, target };
}
