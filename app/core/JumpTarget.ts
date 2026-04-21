import Component from './Component';

/** MIPS J/JAL: PC = { PC+4[31:28], instr[25:0], 2'b00 }. */
export default class JumpTarget extends Component {
  static inputs = ['pcPlus4', 'instruction'];
  static outputs = ['address'];

  update() {
    const pc4 = this.pcPlus4Value >>> 0;
    const instr = this.instructionValue >>> 0;
    const imm26 = instr & 0x03ffffff;
    const addr = ((pc4 & 0xf0000000) | (imm26 << 2)) >>> 0;
    this.addressUpdate(addr);
  }
}
