import Component from './Component';
import { encodeInstruction, type Instruction } from './encoding';

export default class InstructionMemory extends Component {
  static inputs = ['address'];
  static outputs = ['instruction', 'rs', 'rt', 'rd', 'shamt', 'immediate', 'address'];

  /** Word index (byte PC / 4) → instruction */
  private textByWordIndex: Map<number, Instruction> = new Map();

  clear(): void {
    this.textByWordIndex.clear();
  }

  /** Replace map contents (copies entries). */
  loadInstructionMap(map: Map<number, Instruction>): void {
    this.textByWordIndex = new Map(map);
  }

  /** Dense PC=0,4,8,… for `wordIndex` 0..n-1. */
  loadInstructionsDense(instructions: Instruction[]): void {
    this.textByWordIndex.clear();
    for (let i = 0; i < instructions.length; i++) {
      this.textByWordIndex.set(i, instructions[i]);
    }
  }

  getInstructionAtWordIndex(wordIndex: number): Instruction | undefined {
    return this.textByWordIndex.get(wordIndex >>> 0);
  }

  getInstructionMap(): Map<number, Instruction> {
    return this.textByWordIndex;
  }

  update() {
    const address: number = this.addressValue >>> 0;
    const wordIndex = (address >>> 2) >>> 0;
    const instruction = this.textByWordIndex.get(wordIndex) ?? null;

    let encoded = 0;
    let rs = 0,
      rt = 0,
      rd = 0,
      shamt = 0,
      immediate = 0,
      outputAddress = 0;

    if (instruction) {
      encoded = encodeInstruction(instruction);

      rs = instruction.rs ?? instruction.base ?? 0;
      if (instruction.rt !== undefined) rt = instruction.rt;
      if (instruction.rd !== undefined) rd = instruction.rd;
      immediate = instruction.immediate ?? instruction.offset ?? 0;
      if (instruction.type === 'r_type') {
        shamt =
          instruction.shamt !== undefined
            ? instruction.shamt
            : ((encoded >>> 6) & 0x1f);
      }

      outputAddress = encoded & 0xffff;
    }

    this.instructionUpdate(encoded);
    this.rsUpdate(rs);
    this.rtUpdate(rt);
    this.rdUpdate(rd);
    this.shamtUpdate(shamt);
    this.immediateUpdate(immediate);
    this.addressUpdate(outputAddress);
  }
}
