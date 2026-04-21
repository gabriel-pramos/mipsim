import ProgramCounter from './ProgramCounter';
import PCAdder from './PCAdder';
import InstructionMemory from './InstructionMemory';
import ControlUnit from './ControlUnit';
import RegisterFile from './RegisterFile';
import ALU from './ALU';
import DataMemory from './DataMemory';
import MUX from './MUX';
import SignExtender from './SignExtender';
import ShiftLeft2 from './ShiftLeft2';
import PCSrcLogic from './PCSrcLogic';
import Adder from './Adder';
import JumpTarget from './JumpTarget';
import { type Instruction, encodeInstruction } from './encoding';
import { MmioController } from './MmioController';
import {
  MIPS_EXCEPTION_VECTOR,
  STATUS_EXL,
  STATUS_IE,
  STATUS_UM,
  TIMER_IRQ_PERIOD_STEPS,
} from './constants';

function applyMulDiv64(
  hi: { v: number },
  lo: { v: number },
  op: string,
  rsVal: number,
  rtVal: number,
): void {
  const rsU = rsVal >>> 0;
  const rtU = rtVal >>> 0;
  const rsS = rsVal | 0;
  const rtS = rtVal | 0;

  switch (op) {
    case 'mult': {
      const p = BigInt(rsS) * BigInt(rtS);
      lo.v = Number(p & 0xffffffffn) >>> 0;
      hi.v = Number((p >> 32n) & 0xffffffffn) >>> 0;
      break;
    }
    case 'multu': {
      const p = BigInt(rsU) * BigInt(rtU);
      lo.v = Number(p & 0xffffffffn) >>> 0;
      hi.v = Number((p >> 32n) & 0xffffffffn) >>> 0;
      break;
    }
    case 'div':
      if (rtS === 0) {
        hi.v = 0;
        lo.v = 0;
      } else {
        lo.v = ((rsS / rtS) | 0) >>> 0;
        hi.v = ((rsS % rtS) | 0) >>> 0;
      }
      break;
    case 'divu':
      if (rtU === 0) {
        hi.v = 0;
        lo.v = 0;
      } else {
        lo.v = Math.floor(rsU / rtU) >>> 0;
        hi.v = (rsU % rtU) >>> 0;
      }
      break;
    default:
      break;
  }
}

export interface ProcessorState {
  pc: number;
  nextPC: number;
  registers: number[];
  instruction: number;
  instructionFields: {
    rs: number;
    rt: number;
    rd: number;
    immediate: number;
  };
  aluInputs: {
    readData1: number;
    readData2: number;
    aluOp: number;
  };
  aluOutputs: {
    result: number;
    zero: number;
  };
  controlSignals: {
    regDst: number;
    aluSrc: number;
    memToReg: number;
    regWrite: number;
    memRead: number;
    memWrite: number;
    branch: number;
    branchNe: number;
    jump: number;
    regJump: number;
    aluOp: number;
    link: number;
    jalRA: number;
  };
  signExtended: number;
  shiftLeft2: number;
  branchTarget: number;
  pcSrc: number;
  dataMemory: {
    address: number;
    writeData: number;
    readData: number;
  };
  muxOutputs: {
    regDst: number;
    aluSrc: number;
    memToReg: number;
    branchPc: number;
  };
  dataMemoryContents: Record<number, number>;
  instructionAddress: number;
  terminalOutput: string;
  exception: {
    epc: number;
    exl: boolean;
    exceptionVector: number;
    interruptPending: boolean;
    masterInterruptEnable: boolean;
    keyboardInterruptEnable: boolean;
  };
  /** Coprocessor 0 (exceptions / interrupts). */
  cop0: {
    status: number;
    cause: number;
    epc: number;
    /** True when EXL=0 and UM (user mode) is set in Status. */
    userMode: boolean;
    /** True when EXL=1 or UM=0 (kernel / exception). */
    kernelMode: boolean;
  };
}

export class Processor {
  pc = new ProgramCounter();
  pcAdder = new PCAdder();
  branchAdder = new Adder();
  instructionMemory = new InstructionMemory();
  controlUnit = new ControlUnit();
  registerFile = new RegisterFile();
  alu = new ALU();
  dataMemory = new DataMemory();
  mmio = new MmioController();
  signExtender = new SignExtender();

  regDstMux = new MUX();
  aluSrcMux = new MUX();
  memToRegMux = new MUX();
  branchMux = new MUX();
  shiftLeft2 = new ShiftLeft2();
  pcsrcLogic = new PCSrcLogic();
  jumpTarget = new JumpTarget();
  jumpMux = new MUX();
  regJumpMux = new MUX();
  linkWriteDataMux = new MUX();
  linkWriteRegMux = new MUX();

  /** Words in `.text` (PC in [0, userTextWordCount * 4)); kernel code lives at {@link MIPS_EXCEPTION_VECTOR}+. */
  userTextWordCount = 0;

  /** MIPS HI/LO (32-bit each, stored unsigned). */
  hi = 0;
  lo = 0;

  /** Saved PC for eret / external interrupt (CP0 reg 14). */
  epc = 0;
  /** CP0 Status (reg 12): IE, EXL, IM 15:8, UM, … */
  cp0Status = STATUS_UM;
  /** CP0 Cause (reg 13): ExcCode, IP 15:8, … */
  cp0Cause = 0;
  /** Timer IRQ edge (maps to Cause bit 15 / IP7). */
  private pendingTimerEdge = false;
  private timerStepCounter = 0;

  /** In exception handler; blocks nested external interrupts. */
  get exl(): boolean {
    return (this.cp0Status & STATUS_EXL) !== 0;
  }

  /** Fixed MARS-style exception / interrupt entry (byte address). */
  readonly exceptionVector = MIPS_EXCEPTION_VECTOR;

  constructor(instructions: Instruction[] = []) {
    this.wireComponents();
    this.dataMemory.setMmio(this.mmio);
    if (instructions.length > 0) {
      this.loadDenseInstructions(instructions);
    }
  }

  private wireComponents() {
    // PC -> InstructionMemory
    this.pc.connect('PC', this.instructionMemory, 'address');
    // PC -> PCAdder
    this.pc.connect('PC', this.pcAdder, 'PC');

    // InstructionMemory -> ControlUnit
    this.instructionMemory.connect('instruction', this.controlUnit, 'instruction');
    // InstructionMemory -> RegisterFile (read register addresses)
    this.instructionMemory.connect('rs', this.registerFile, 'readRegister1');
    this.instructionMemory.connect('rt', this.registerFile, 'readRegister2');

    // InstructionMemory -> ALU (R-type shift amount)
    this.instructionMemory.connect('shamt', this.alu, 'shamt');

    // InstructionMemory -> RegDst MUX (rt vs rd for write register)
    this.instructionMemory.connect('rt', this.regDstMux, 'input0');
    this.instructionMemory.connect('rd', this.regDstMux, 'input1');

    // ControlUnit -> RegDst MUX selector
    this.controlUnit.connect('RegDst', this.regDstMux, 'selector');

    // ControlUnit -> RegisterFile
    this.controlUnit.connect('RegWrite', this.registerFile, 'RegWrite');

    // InstructionMemory -> SignExtender
    this.instructionMemory.connect('immediate', this.signExtender, 'immediate');

    // RegisterFile -> ALU src MUX (readData2 vs sign-extended immediate)
    this.registerFile.connect('readData2', this.aluSrcMux, 'input0');
    this.signExtender.connect('signExtended', this.aluSrcMux, 'input1');
    this.controlUnit.connect('ALUSrc', this.aluSrcMux, 'selector');

    // RegisterFile -> ALU
    this.registerFile.connect('readData1', this.alu, 'readData1');
    this.aluSrcMux.connect('output', this.alu, 'readData2');

    // ControlUnit -> ALU
    this.controlUnit.connect('ALUOp', this.alu, 'ALUOp');

    // ALU -> DataMemory
    this.alu.connect('result', this.dataMemory, 'address');
    this.registerFile.connect('readData2', this.dataMemory, 'writeData');
    this.controlUnit.connect('MemRead', this.dataMemory, 'MemRead');
    this.controlUnit.connect('MemWrite', this.dataMemory, 'MemWrite');
    this.controlUnit.connect('MemWidth', this.dataMemory, 'MemWidth');
    this.controlUnit.connect('LoadUnsigned', this.dataMemory, 'LoadUnsigned');

    // MemToReg MUX (ALU result vs memory read data)
    this.alu.connect('result', this.memToRegMux, 'input0');
    this.dataMemory.connect('readData', this.memToRegMux, 'input1');
    this.controlUnit.connect('MemToReg', this.memToRegMux, 'selector');

    // MemToReg MUX -> (optional PC+4 for jal / branch-and-link) -> RegisterFile
    this.memToRegMux.connect('output', this.linkWriteDataMux, 'input0');
    this.pcAdder.connect('nextPC', this.linkWriteDataMux, 'input1');
    this.controlUnit.connect('Link', this.linkWriteDataMux, 'selector');
    this.linkWriteDataMux.connect('output', this.registerFile, 'writeData');

    this.regDstMux.connect('output', this.linkWriteRegMux, 'input0');
    this.linkWriteRegMux.setInput('input1', 31);
    this.controlUnit.connect('JalRA', this.linkWriteRegMux, 'selector');
    this.linkWriteRegMux.connect('output', this.registerFile, 'writeRegister');

    // PCSrc = Branch && (BranchNe ? !zero : zero)
    this.controlUnit.connect('Branch', this.pcsrcLogic, 'branch');
    this.controlUnit.connect('BranchNe', this.pcsrcLogic, 'branchNe');
    this.controlUnit.connect('BranchLez', this.pcsrcLogic, 'branchLez');
    this.controlUnit.connect('BranchGtz', this.pcsrcLogic, 'branchGtz');
    this.alu.connect('zero', this.pcsrcLogic, 'zero');
    this.registerFile.connect('readData1', this.pcsrcLogic, 'readData1');

    // Branch adder: PC+4 + (sign-extended immediate << 2)
    this.pcAdder.connect('nextPC', this.branchAdder, 'a');
    this.signExtender.connect('signExtended', this.shiftLeft2, 'signExtended');
    this.shiftLeft2.connect('shifted', this.branchAdder, 'b');

    // Branch MUX: PC+4 vs branch target (selector = PCSrc)
    this.pcAdder.connect('nextPC', this.branchMux, 'input0');
    this.branchAdder.connect('output', this.branchMux, 'input1');
    this.pcsrcLogic.connect('pcSrc', this.branchMux, 'selector');

    // J/JAL target from instruction[25:0] and PC+4 high bits
    this.pcAdder.connect('nextPC', this.jumpTarget, 'pcPlus4');
    this.instructionMemory.connect('instruction', this.jumpTarget, 'instruction');

    // Jump MUX: branch path vs jump target (selector = Jump)
    this.branchMux.connect('output', this.jumpMux, 'input0');
    this.jumpTarget.connect('address', this.jumpMux, 'input1');
    this.controlUnit.connect('Jump', this.jumpMux, 'selector');

    this.jumpMux.connect('output', this.regJumpMux, 'input0');
    this.registerFile.connect('readData1', this.regJumpMux, 'input1');
    this.controlUnit.connect('RegJump', this.regJumpMux, 'selector');
    this.regJumpMux.connect('output', this.pc, 'input');
  }

  /** Dense user segment at byte PCs 0, 4, 8, … */
  loadDenseInstructions(instructions: Instruction[]) {
    this.userTextWordCount = instructions.length;
    this.instructionMemory.loadInstructionsDense(instructions);
    this.reset();
  }

  /**
   * Sparse layout: `wordIndex` → instruction. `userTextWordCount` is the number of
   * user `.text` words starting at word index 0 (for run/step “past end of user code”).
   */
  loadInstructionMap(map: Map<number, Instruction>, userTextWordCount: number) {
    this.userTextWordCount = userTextWordCount;
    this.instructionMemory.loadInstructionMap(map);
    this.reset();
  }

  /** Lay out `.data` bytes starting at 0 (matches parser symbol addresses). */
  loadDataSegment(bytes: number[]): void {
    this.dataMemory.seedBytes(0, bytes);
  }

  /** @deprecated Prefer {@link loadDenseInstructions}; kept for call sites. */
  loadInstructions(instructions: Instruction[]) {
    this.loadDenseInstructions(instructions);
  }

  reset() {
    this.pc.PC = 0;
    this.hi = 0;
    this.lo = 0;
    this.epc = 0;
    this.cp0Status = STATUS_UM;
    this.cp0Cause = 0;
    this.pendingTimerEdge = false;
    this.timerStepCounter = 0;
    this.registerFile.registers = new Array(32).fill(0);
    this.dataMemory.dataMemory = {};
    this.mmio.reset();

    this.pc.PCUpdate(0);
  }

  enqueueKeyboardAscii(text: string): void {
    this.mmio.enqueueKeyboardAscii(text);
    if (this.mmio.kbdInterruptEnable && this.mmio.masterInterruptEnable) {
      this.cp0Cause |= 0x100;
    }
  }

  private readCp0Register(rd: number): number {
    switch (rd) {
      case 12:
        return this.cp0Status >>> 0;
      case 13:
        return this.getCauseForRead() >>> 0;
      case 14:
        return this.epc >>> 0;
      default:
        return 0;
    }
  }

  /** Cause as visible to mfc0, including legacy keyboard pending. */
  private getCauseForRead(): number {
    let c = this.cp0Cause >>> 0;
    if (this.mmio.interruptPending && this.mmio.kbdInterruptEnable && this.mmio.masterInterruptEnable) {
      c |= 0x100;
    }
    return c;
  }

  private writeCp0Register(rd: number, value: number): void {
    const v = value >>> 0;
    switch (rd) {
      case 12:
        this.cp0Status = v;
        break;
      case 13:
        this.cp0Cause = v;
        break;
      case 14:
        this.epc = v;
        break;
      default:
        break;
    }
  }

  private deliverPendingInterrupt(): void {
    if (this.exl) return;

    const im = (this.cp0Status >>> 8) & 0xff;
    let ipByte = (this.cp0Cause >>> 8) & 0xff;
    if (this.pendingTimerEdge) ipByte |= 0x80;
    if (this.mmio.interruptPending && this.mmio.masterInterruptEnable && this.mmio.kbdInterruptEnable) {
      ipByte |= 0x01;
    }

    const ie = (this.cp0Status & STATUS_IE) !== 0;
    const cp0Ready = ie && im !== 0 && (im & ipByte) !== 0;
    const legacyReady =
      !ie &&
      this.mmio.interruptPending &&
      this.mmio.masterInterruptEnable &&
      this.mmio.kbdInterruptEnable;

    if (!cp0Ready && !legacyReady) return;

    this.epc = this.pc.PC >>> 0;
    this.cp0Cause = (this.cp0Cause & ~0xff00) | ((ipByte & 0xff) << 8);
    this.cp0Cause &= ~0x7c;

    if (cp0Ready && this.pendingTimerEdge && (im & 0x80) !== 0) {
      this.pendingTimerEdge = false;
    }

    const v = this.exceptionVector >>> 0;
    this.pc.PC = v;
    this.pc.PCUpdate(v);
    this.cp0Status |= STATUS_EXL;

    if (legacyReady) {
      this.mmio.interruptPending = false;
      this.cp0Cause &= ~0x100;
    }
  }

  private applySpecialInstruction(instr: Instruction | undefined): void {
    if (!instr) return;
    const op = instr.op.toLowerCase();

    if (op === 'eret') {
      this.pc.PC = this.epc >>> 0;
      this.pc.PCUpdate(this.epc >>> 0);
      this.cp0Status &= ~STATUS_EXL;
      this.cp0Cause &= ~0x8000;
      return;
    }

    if (instr.type === 'special' && op === 'syscall') {
      const rf = this.registerFile;
      const v0 = rf.read(2);
      const a0 = rf.read(4);
      if (v0 === 4) {
        let addr = a0 >>> 0;
        let out = '';
        for (let guard = 0; guard < 65536; guard++) {
          const b = this.dataMemory.readByteDirect(addr);
          if (b === 0) break;
          out += String.fromCharCode(b);
          addr = (addr + 1) >>> 0;
        }
        this.mmio.appendProgramText(out);
      } else if (v0 === 10) {
        const end = this.getUserTextEndPc() >>> 0;
        this.pc.PC = end;
        this.pc.PCUpdate(end);
      }
      return;
    }

    if (instr.type === 'cop0_type') {
      const rt = instr.rt ?? 0;
      const rd = instr.rd ?? 0;
      const rf = this.registerFile;
      if (op === 'mfc0') {
        rf.write(rt, this.readCp0Register(rd));
      } else if (op === 'mtc0') {
        this.writeCp0Register(rd, rf.read(rt));
      }
      return;
    }

    if (instr.type !== 'r_type') return;
    const rs = instr.rs ?? 0;
    const rt = instr.rt ?? 0;
    const rd = instr.rd ?? 0;
    const rf = this.registerFile;

    const rsVal = rf.read(rs);
    const rtVal = rf.read(rt);

    switch (op) {
      case 'mult':
      case 'multu':
      case 'div':
      case 'divu': {
        const boxHi = { v: this.hi };
        const boxLo = { v: this.lo };
        applyMulDiv64(boxHi, boxLo, op, rsVal, rtVal);
        this.hi = boxHi.v;
        this.lo = boxLo.v;
        break;
      }
      case 'mthi':
        this.hi = rsVal >>> 0;
        break;
      case 'mtlo':
        this.lo = rsVal >>> 0;
        break;
      case 'mfhi':
        rf.write(rd, this.hi);
        break;
      case 'mflo':
        rf.write(rd, this.lo);
        break;
      case 'mul':
        rf.write(rd, ((rsVal | 0) * (rtVal | 0)) >>> 0);
        break;
      default:
        break;
    }
  }

  step() {
    const executedPc = this.pc.PC >>> 0;
    const wi = (executedPc >>> 2) >>> 0;
    const instr = this.instructionMemory.getInstructionAtWordIndex(wi);

    this.registerFile.commit();
    this.dataMemory.commit();
    this.pc.clock();
    this.applySpecialInstruction(instr);

    this.timerStepCounter++;
    if (this.timerStepCounter >= TIMER_IRQ_PERIOD_STEPS) {
      this.timerStepCounter = 0;
      if (!this.exl) this.pendingTimerEdge = true;
    }

    this.deliverPendingInterrupt();
  }

  getState(): ProcessorState {
    const wi = (this.pc.PC >>> 2) >>> 0;
    const currentInstr = this.instructionMemory.getInstructionAtWordIndex(wi) ?? null;
    let encoded = 0;
    if (currentInstr) {
      encoded = encodeInstruction(currentInstr);
    }

    return {
      pc: this.pc.PC,
      nextPC: this.pcAdder.getOutput('nextPC') || this.pc.PC + 4,
      registers: [...this.registerFile.registers],
      instruction: encoded,
      instructionFields: {
        rs: currentInstr?.rs ?? currentInstr?.base ?? 0,
        rt: currentInstr?.rt ?? 0,
        rd: currentInstr?.rd ?? 0,
        immediate: currentInstr?.immediate ?? currentInstr?.offset ?? 0,
      },
      aluInputs: {
        readData1: this.alu.readData1Value || 0,
        readData2: this.alu.readData2Value || 0,
        aluOp: this.alu.ALUOpValue || 0,
      },
      aluOutputs: {
        result: this.alu.getOutput('result') || 0,
        zero: this.alu.getOutput('zero') ? 1 : 0,
      },
      controlSignals: {
        regDst: this.controlUnit.getOutput('RegDst') || 0,
        aluSrc: this.controlUnit.getOutput('ALUSrc') || 0,
        memToReg: this.controlUnit.getOutput('MemToReg') || 0,
        regWrite: this.controlUnit.getOutput('RegWrite') || 0,
        memRead: this.controlUnit.getOutput('MemRead') || 0,
        memWrite: this.controlUnit.getOutput('MemWrite') || 0,
        branch: this.controlUnit.getOutput('Branch') || 0,
        branchNe: this.controlUnit.getOutput('BranchNe') || 0,
        jump: this.controlUnit.getOutput('Jump') || 0,
        regJump: this.controlUnit.getOutput('RegJump') || 0,
        aluOp: this.controlUnit.getOutput('ALUOp') || 0,
        link: this.controlUnit.getOutput('Link') || 0,
        jalRA: this.controlUnit.getOutput('JalRA') || 0,
      },
      signExtended: this.signExtender.getOutput('signExtended') || 0,
      shiftLeft2: this.shiftLeft2.getOutput('shifted') || 0,
      branchTarget: this.branchAdder.getOutput('output') || 0,
      pcSrc: this.pcsrcLogic.getOutput('pcSrc') || 0,
      dataMemory: {
        address: this.dataMemory.addressValue || 0,
        writeData: this.dataMemory.writeDataValue || 0,
        readData: this.dataMemory.getOutput('readData') || 0,
      },
      muxOutputs: {
        regDst: this.regDstMux.getOutput('output') ?? 0,
        aluSrc: this.aluSrcMux.getOutput('output') ?? 0,
        memToReg: this.memToRegMux.getOutput('output') ?? 0,
        branchPc: this.branchMux.getOutput('output') ?? 0,
      },
      dataMemoryContents: { ...this.dataMemory.dataMemory },
      instructionAddress: this.pc.PC,
      terminalOutput: this.mmio.getTerminalOutput(),
      exception: {
        epc: this.epc,
        exl: this.exl,
        exceptionVector: this.exceptionVector,
        interruptPending: this.mmio.interruptPending,
        masterInterruptEnable: this.mmio.masterInterruptEnable,
        keyboardInterruptEnable: this.mmio.kbdInterruptEnable,
      },
      cop0: {
        status: this.cp0Status >>> 0,
        cause: this.getCauseForRead() >>> 0,
        epc: this.epc >>> 0,
        userMode: !this.exl && (this.cp0Status & STATUS_UM) !== 0,
        kernelMode: this.exl || (this.cp0Status & STATUS_UM) === 0,
      },
    };
  }

  getInstructions(): Instruction[] {
    const out: Instruction[] = [];
    for (let i = 0; i < this.userTextWordCount; i++) {
      const ins = this.instructionMemory.getInstructionAtWordIndex(i);
      if (ins) out.push(ins);
    }
    return out;
  }

  /** Byte PC immediately after the last user `.text` word (exclusive). */
  getUserTextEndPc(): number {
    return this.userTextWordCount * 4;
  }

  /**
   * True when PC has left the user segment (into the gap before kseg1) so the run loop can stop.
   * Does not fire while PC is in the kernel region at {@link MIPS_EXCEPTION_VECTOR}.
   */
  isPcPastUserText(pc: number): boolean {
    if (this.userTextWordCount <= 0) return true;
    const p = pc >>> 0;
    const end = (this.userTextWordCount * 4) >>> 0;
    return p >= end && p < MIPS_EXCEPTION_VECTOR;
  }
}
