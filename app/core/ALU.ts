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

function toU32(n: number): number {
  return n >>> 0;
}

function toI32(n: number): number {
  return n | 0;
}

export default class ALU extends Component {
  static inputs = ['readData1', 'readData2', 'ALUOp', 'shamt'];
  static outputs = ['result', 'zero'];

  update() {
    const a = toI32(this.readData1Value);
    const b = toI32(this.readData2Value);
    const sh = (this.shamtValue ?? 0) & 0x1f;
    const imm16 = toU32(this.readData2Value) & 0xffff;

    let result = 0;

    switch (this.ALUOpValue) {
      case ALU_AND:
        result = a & b;
        break;
      case ALU_OR:
        result = a | b;
        break;
      case ALU_ADD:
        result = a + b;
        break;
      case ALU_SUB:
        result = a - b;
        break;
      case ALU_SLT:
        result = a < b ? 1 : 0;
        break;
      case ALU_NOR:
        result = ~(toU32(a) | toU32(b));
        break;
      case ALU_XOR:
        result = a ^ b;
        break;
      case ALU_SLTU:
        result = toU32(a) < toU32(b) ? 1 : 0;
        break;
      case ALU_SLL:
        result = toU32(b) << sh;
        break;
      case ALU_SRL:
        result = toU32(b) >>> sh;
        break;
      case ALU_SRA:
        result = b >> sh;
        break;
      case ALU_SLLV:
        result = toU32(b) << (a & 0x1f);
        break;
      case ALU_SRLV:
        result = toU32(b) >>> (a & 0x1f);
        break;
      case ALU_SRAV:
        result = b >> (a & 0x1f);
        break;
      case ALU_LUI:
        result = imm16 << 16;
        break;
      case ALU_SLTIU:
        result = toU32(a) < imm16 ? 1 : 0;
        break;
      case ALU_ANDI:
        result = a & imm16;
        break;
      case ALU_ORI:
        result = a | imm16;
        break;
      case ALU_XORI:
        result = a ^ imm16;
        break;
      default:
        result = a + b;
    }

    result = toU32(result);
    const zero = result === 0;

    this.resultUpdate(result);
    this.zeroUpdate(zero);
  }
}
