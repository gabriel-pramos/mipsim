/** Matches DataMemory width encoding. */
export type MmioMemWidth = 0 | 1 | 2;

export const MMIO_KEYBOARD_CTRL = 0xffff0000;
export const MMIO_KEYBOARD_DATA = 0xffff0004;
export const MMIO_DISPLAY_CTRL = 0xffff0008;
export const MMIO_DISPLAY_DATA = 0xffff000c;
export const MMIO_SIM_STATUS = 0xffff0010;

function alignWord(addr: number): number {
  return ((addr >>> 0) & 0xfffffffc) >>> 0;
}

function readByteBE(word: number, addr: number): number {
  const pos = addr & 3;
  const shift = (3 - pos) * 8;
  return (word >>> shift) & 0xff;
}

function readHalfBE(word: number, addr: number): number {
  const b0 = readByteBE(word, addr);
  const b1 = readByteBE(word, addr + 1);
  return (b0 << 8) | b1;
}

function writeByteBE(word: number, addr: number, byte: number): number {
  const pos = addr & 3;
  const shift = (3 - pos) * 8;
  const mask = ~(0xff << shift) >>> 0;
  return ((word & mask) | ((byte & 0xff) << shift)) >>> 0;
}

function writeHalfBE(word: number, addr: number, half: number): number {
  let w = word;
  w = writeByteBE(w, addr, (half >>> 8) & 0xff);
  w = writeByteBE(w, addr + 1, half & 0xff);
  return w >>> 0;
}

/**
 * MARS-style keyboard (0xFFFF0000/4) and display (0xFFFF0008/C), plus 0xFFFF0010 bit0 master interrupt enable.
 */
export class MmioController {
  private rxQueue: number[] = [];
  private terminal = '';
  /** Bit 0 writable: keyboard interrupt enable. Bit 1 read-only: ready. */
  kbdInterruptEnable = false;
  masterInterruptEnable = true;
  interruptPending = false;

  reset(): void {
    this.rxQueue = [];
    this.terminal = '';
    this.kbdInterruptEnable = false;
    this.masterInterruptEnable = true;
    this.interruptPending = false;
  }

  getTerminalOutput(): string {
    return this.terminal;
  }

  /** Syscall print_string / program-level output (same stream as MMIO display). */
  appendProgramText(text: string): void {
    this.terminal += text;
  }

  keyboardCtrlWord(): number {
    let v = this.kbdInterruptEnable ? 1 : 0;
    if (this.rxQueue.length > 0) v |= 2;
    return v >>> 0;
  }

  displayCtrlWord(): number {
    return 1;
  }

  simStatusWord(): number {
    return this.masterInterruptEnable ? 1 : 0;
  }

  /** Pop one byte from keyboard FIFO (MARS: data in LS byte of word). */
  private popKeyboardByte(): number {
    if (this.rxQueue.length === 0) return 0;
    return this.rxQueue.shift()! & 0xff;
  }

  private readWordInternal(base: number): number {
    const b = base >>> 0;
    switch (b) {
      case MMIO_KEYBOARD_CTRL:
        return this.keyboardCtrlWord();
      case MMIO_KEYBOARD_DATA:
        return 0;
      case MMIO_DISPLAY_CTRL:
        return this.displayCtrlWord();
      case MMIO_DISPLAY_DATA:
        return 0;
      case MMIO_SIM_STATUS:
        return this.simStatusWord();
      default:
        return 0;
    }
  }

  readMem(addr: number, memWidth: MmioMemWidth, unsigned: boolean): number {
    const a = addr >>> 0;

    if (alignWord(a) === MMIO_KEYBOARD_DATA) {
      const raw = this.popKeyboardByte();
      if (memWidth === 0) {
        return raw >>> 0;
      }
      if (memWidth === 1) {
        const hv = raw & 0xffff;
        return (unsigned ? hv : ((((hv << 16) >> 16) >>> 0) >>> 0)) >>> 0;
      }
      const bv = raw & 0xff;
      return (unsigned ? bv : ((((bv << 24) >> 24) >>> 0) >>> 0)) >>> 0;
    }

    let readData = 0;
    if (memWidth === 0) {
      readData = this.readWordInternal(alignWord(a));
    } else if (memWidth === 1) {
      const base = alignWord(a);
      const w = this.readWordInternal(base);
      const h = readHalfBE(w, a);
      const hv = h & 0xffff;
      readData = unsigned ? hv : ((((hv << 16) >> 16) >>> 0) >>> 0);
    } else {
      const base = alignWord(a);
      const w = this.readWordInternal(base);
      const b = readByteBE(w, a);
      const bv = b & 0xff;
      readData = unsigned ? bv : ((((bv << 24) >> 24) >>> 0) >>> 0);
    }

    return readData >>> 0;
  }

  private applyCtrlWord(base: number, w: number): void {
    const word = w >>> 0;
    if (base === MMIO_KEYBOARD_CTRL) {
      this.kbdInterruptEnable = (word & 1) !== 0;
    } else if (base === MMIO_SIM_STATUS) {
      this.masterInterruptEnable = (word & 1) !== 0;
    }
  }

  private appendDisplayByte(byte: number): void {
    const c = byte & 0xff;
    if (c === 13) {
      this.terminal += '\n';
    } else {
      this.terminal += String.fromCharCode(c);
    }
  }

  writeMem(addr: number, wdata: number, memWidth: MmioMemWidth): void {
    const a = addr >>> 0;
    const wd = wdata >>> 0;

    if (alignWord(a) === MMIO_DISPLAY_DATA) {
      // MemWidth: 0 = word, 1 = half, 2 = byte (same as DataMemory)
      if (memWidth === 0) {
        this.appendDisplayByte(wd & 0xff);
      } else if (memWidth === 1) {
        this.appendDisplayByte((wd >>> 8) & 0xff);
        this.appendDisplayByte(wd & 0xff);
      } else {
        let word = this.peekWordForRmW(MMIO_DISPLAY_DATA);
        word = writeByteBE(word, a, wd & 0xff);
        this.appendDisplayByte(readByteBE(word, a));
      }
      return;
    }

    if (alignWord(a) === MMIO_KEYBOARD_CTRL || alignWord(a) === MMIO_SIM_STATUS) {
      const base = alignWord(a);
      let word = this.peekWordForRmW(base);
      if (memWidth === 0) {
        word = wd;
      } else if (memWidth === 1) {
        word = writeHalfBE(word, a, wd & 0xffff);
      } else {
        word = writeByteBE(word, a, wd & 0xff);
      }
      this.applyCtrlWord(base, word);
      return;
    }
  }

  /** Word image for RMW (does not consume keyboard FIFO). */
  private peekWordForRmW(base: number): number {
    const b = base >>> 0;
    switch (b) {
      case MMIO_KEYBOARD_CTRL:
        return this.keyboardCtrlWord();
      case MMIO_KEYBOARD_DATA:
        return this.rxQueue.length > 0 ? (this.rxQueue[0] & 0xff) >>> 0 : 0;
      case MMIO_DISPLAY_CTRL:
        return this.displayCtrlWord();
      case MMIO_DISPLAY_DATA:
        return 0;
      case MMIO_SIM_STATUS:
        return this.simStatusWord();
      default:
        return 0;
    }
  }

  enqueueKey(byte: number): void {
    this.rxQueue.push(byte & 0xff);
    if (this.kbdInterruptEnable && this.masterInterruptEnable) {
      this.interruptPending = true;
    }
  }

  enqueueKeyboardAscii(text: string): void {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 256) this.enqueueKey(code);
    }
  }
}
