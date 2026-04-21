import Component from './Component';
import {
  ALU_AND,
  ALU_OR,
  ALU_ADD,
  ALU_SUB,
  ALU_SLT,
  ALU_NOR,
  ALU_XOR,
  ALU_SLTU,
  ALU_SLL,
  ALU_SRL,
  ALU_SRA,
  ALU_SLLV,
  ALU_SRLV,
  ALU_SRAV,
  ALU_LUI,
  ALU_SLTIU,
  ALU_ANDI,
  ALU_ORI,
  ALU_XORI,
} from './constants';

export default class ControlUnit extends Component {
  static inputs = ['instruction'];
  static outputs = [
    'RegDst',
    'ALUSrc',
    'MemToReg',
    'RegWrite',
    'MemRead',
    'MemWrite',
    'Branch',
    'BranchNe',
    'BranchLez',
    'BranchGtz',
    'Jump',
    'RegJump',
    'ALUOp',
    'Link',
    'JalRA',
    'MemWidth',
    'LoadUnsigned',
  ];

  update() {
    const instruction = this.instructionValue;
    const opcode = (instruction >>> 26) & 0x3f;
    const funct = instruction & 0x3f;

    let RegDst = 0;
    let ALUSrc = 0;
    let MemToReg = 0;
    let RegWrite = 0;
    let MemRead = 0;
    let MemWrite = 0;
    let Branch = 0;
    let BranchNe = 0;
    let BranchLez = 0;
    let BranchGtz = 0;
    let Jump = 0;
    let RegJump = 0;
    let Link = 0;
    let JalRA = 0;
    let ALUOp = ALU_ADD;
    let MemWidth = 0;
    let LoadUnsigned = 0;

    const rt = (instruction >>> 16) & 0x1f;

    switch (opcode) {
      case 0x00: {
        if (funct === 0x08) {
          RegJump = 1;
          break;
        }
        if (funct === 0x09) {
          RegDst = 1;
          RegWrite = 1;
          RegJump = 1;
          Link = 1;
          JalRA = 0;
          ALUOp = ALU_ADD;
          break;
        }
        if (
          funct === 0x18 ||
          funct === 0x19 ||
          funct === 0x1a ||
          funct === 0x1b ||
          funct === 0x0c ||
          funct === 0x11 ||
          funct === 0x13 ||
          funct === 0x10 ||
          funct === 0x12 ||
          funct === 0x1c
        ) {
          // mult, multu, div, divu, syscall, mthi, mtlo, mfhi, mflo, mul — GPR / HI-LO via Processor.applySpecialInstruction
          RegWrite = 0;
          ALUOp = ALU_ADD;
          break;
        }
        RegDst = 1;
        RegWrite = 1;
        ALUOp = this.getALUOpFromFunct(funct);
        break;
      }
      case 0x23: // lw
        ALUSrc = 1;
        MemToReg = 1;
        RegWrite = 1;
        MemRead = 1;
        ALUOp = ALU_ADD;
        MemWidth = 0;
        LoadUnsigned = 1;
        break;
      case 0x21: // lh
        ALUSrc = 1;
        MemToReg = 1;
        RegWrite = 1;
        MemRead = 1;
        ALUOp = ALU_ADD;
        MemWidth = 1;
        LoadUnsigned = 0;
        break;
      case 0x25: // lhu
        ALUSrc = 1;
        MemToReg = 1;
        RegWrite = 1;
        MemRead = 1;
        ALUOp = ALU_ADD;
        MemWidth = 1;
        LoadUnsigned = 1;
        break;
      case 0x20: // lb
        ALUSrc = 1;
        MemToReg = 1;
        RegWrite = 1;
        MemRead = 1;
        ALUOp = ALU_ADD;
        MemWidth = 2;
        LoadUnsigned = 0;
        break;
      case 0x24: // lbu
        ALUSrc = 1;
        MemToReg = 1;
        RegWrite = 1;
        MemRead = 1;
        ALUOp = ALU_ADD;
        MemWidth = 2;
        LoadUnsigned = 1;
        break;
      case 0x2b: // sw
        ALUSrc = 1;
        MemWrite = 1;
        ALUOp = ALU_ADD;
        MemWidth = 0;
        break;
      case 0x29: // sh
        ALUSrc = 1;
        MemWrite = 1;
        ALUOp = ALU_ADD;
        MemWidth = 1;
        break;
      case 0x28: // sb
        ALUSrc = 1;
        MemWrite = 1;
        ALUOp = ALU_ADD;
        MemWidth = 2;
        break;
      case 0x04: // beq
        Branch = 1;
        BranchNe = 0;
        ALUOp = ALU_SUB;
        break;
      case 0x05: // bne
        Branch = 1;
        BranchNe = 1;
        ALUOp = ALU_SUB;
        break;
      case 0x06: // blez
        Branch = 1;
        BranchLez = 1;
        ALUOp = ALU_ADD;
        break;
      case 0x07: // bgtz
        Branch = 1;
        BranchGtz = 1;
        ALUOp = ALU_ADD;
        break;
      case 0x08: // addi
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_ADD;
        break;
      case 0x09: // addiu
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_ADD;
        break;
      case 0x0c: // andi
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_ANDI;
        break;
      case 0x0d: // ori
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_ORI;
        break;
      case 0x0e: // xori
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_XORI;
        break;
      case 0x0a: // slti
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_SLT;
        break;
      case 0x0b: // sltiu
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_SLTIU;
        break;
      case 0x0f: // lui
        ALUSrc = 1;
        RegWrite = 1;
        ALUOp = ALU_LUI;
        break;
      case 0x02: // j
        Jump = 1;
        break;
      case 0x03: // jal
        Jump = 1;
        RegWrite = 1;
        Link = 1;
        JalRA = 1;
        break;
      case 0x10: {
        const rsCop = (instruction >>> 21) & 0x1f;
        const cofun = instruction & 0x3f;
        // COP0: mfc0 (rs=0), mtc0 (rs=4) — handled in Processor.applySpecialInstruction
        if (rsCop === 0 || rsCop === 4) {
          RegWrite = 0;
          MemRead = 0;
          MemWrite = 0;
          Branch = 0;
          Jump = 0;
          RegJump = 0;
          ALUOp = ALU_ADD;
          break;
        }
        // eret (0x42000018) — PC restored in Processor.applySpecialInstruction
        if (cofun === 0x18) {
          RegWrite = 0;
          MemRead = 0;
          MemWrite = 0;
          Branch = 0;
          Jump = 0;
          RegJump = 0;
          ALUOp = ALU_ADD;
        }
        break;
      }
      case 0x01: {
        ALUSrc = 0;
        Branch = 1;
        ALUOp = ALU_SLT;
        switch (rt) {
          case 0x00: // bltz
            BranchNe = 1;
            break;
          case 0x01: // bgez
            BranchNe = 0;
            break;
          case 0x10: // bltzal
            BranchNe = 1;
            RegWrite = 1;
            Link = 1;
            JalRA = 1;
            break;
          case 0x11: // bgezal
            BranchNe = 0;
            RegWrite = 1;
            Link = 1;
            JalRA = 1;
            break;
          default:
            break;
        }
        break;
      }
      default:
        break;
    }

    this.RegDstUpdate(RegDst);
    this.ALUSrcUpdate(ALUSrc);
    this.MemToRegUpdate(MemToReg);
    this.RegWriteUpdate(RegWrite);
    this.MemReadUpdate(MemRead);
    this.MemWriteUpdate(MemWrite);
    this.BranchUpdate(Branch);
    this.BranchNeUpdate(BranchNe);
    this.BranchLezUpdate(BranchLez);
    this.BranchGtzUpdate(BranchGtz);
    this.JumpUpdate(Jump);
    this.RegJumpUpdate(RegJump);
    this.ALUOpUpdate(ALUOp);
    this.LinkUpdate(Link);
    this.JalRAUpdate(JalRA);
    this.MemWidthUpdate(MemWidth);
    this.LoadUnsignedUpdate(LoadUnsigned);
  }

  getALUOpFromFunct(funct: number): number {
    switch (funct) {
      case 0x00:
        return ALU_SLL;
      case 0x02:
        return ALU_SRL;
      case 0x03:
        return ALU_SRA;
      case 0x04:
        return ALU_SLLV;
      case 0x06:
        return ALU_SRLV;
      case 0x07:
        return ALU_SRAV;
      case 0x20:
        return ALU_ADD;
      case 0x21:
        return ALU_ADD;
      case 0x22:
        return ALU_SUB;
      case 0x23:
        return ALU_SUB;
      case 0x24:
        return ALU_AND;
      case 0x25:
        return ALU_OR;
      case 0x26:
        return ALU_XOR;
      case 0x27:
        return ALU_NOR;
      case 0x2a:
        return ALU_SLT;
      case 0x2b:
        return ALU_SLTU;
      default:
        return ALU_ADD;
    }
  }
}
