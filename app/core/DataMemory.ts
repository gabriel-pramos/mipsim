import Component from './Component';
import type { MmioController } from './MmioController';

/** 0 = word, 1 = half (16-bit), 2 = byte */
export type MemWidth = 0 | 1 | 2;

function isMmioAddress(addr: number): boolean {
  const a = addr >>> 0;
  return a >= 0xffff0000 && a <= 0xffff0013;
}

function alignWord(addr: number): number {
  return ((addr >>> 0) & 0xfffffffc) >>> 0;
}

/** Big-endian word at aligned base. */
function readWord(data: Record<number, number>, base: number): number {
  const w = data[base];
  return w !== undefined ? w >>> 0 : 0;
}

function writeWord(data: Record<number, number>, base: number, word: number): void {
  data[base] = word >>> 0;
}

function readByteBE(data: Record<number, number>, addr: number): number {
  const base = alignWord(addr);
  const w = readWord(data, base);
  const pos = addr & 3;
  const shift = (3 - pos) * 8;
  return (w >>> shift) & 0xff;
}

function writeByteBE(
  data: Record<number, number>,
  addr: number,
  byte: number,
): void {
  const base = alignWord(addr);
  const pos = addr & 3;
  const shift = (3 - pos) * 8;
  let w = readWord(data, base);
  const mask = ~(0xff << shift) >>> 0;
  w = (w & mask) | ((byte & 0xff) << shift);
  writeWord(data, base, w);
}

function readHalfBE(data: Record<number, number>, addr: number): number {
  const b0 = readByteBE(data, addr);
  const b1 = readByteBE(data, addr + 1);
  return (b0 << 8) | b1;
}

function writeHalfBE(data: Record<number, number>, addr: number, half: number): void {
  writeByteBE(data, addr, (half >>> 8) & 0xff);
  writeByteBE(data, addr + 1, half & 0xff);
}

export default class DataMemory extends Component {
  static inputs = ['address', 'writeData', 'MemRead', 'MemWrite', 'MemWidth', 'LoadUnsigned'];
  static outputs = ['readData'];

  dataMemory: Record<number, number> = {};
  mmio: MmioController | null = null;

  setMmio(controller: MmioController | null): void {
    this.mmio = controller;
  }

  update() {
    const addr = this.addressValue >>> 0;
    const memRead = !!this.MemReadValue;
    const memWidth = (this.MemWidthValue ?? 0) as MemWidth;
    const unsigned = !!this.LoadUnsignedValue;

    let readData = 0;

    if (memRead) {
      if (this.mmio && isMmioAddress(addr)) {
        readData = this.mmio.readMem(addr, memWidth, unsigned);
      } else if (memWidth === 0) {
        readData = readWord(this.dataMemory, alignWord(addr));
      } else if (memWidth === 1) {
        const h = readHalfBE(this.dataMemory, addr);
        const hv = h & 0xffff;
        readData = unsigned ? hv : ((((hv << 16) >> 16) >>> 0) >>> 0);
      } else {
        const b = readByteBE(this.dataMemory, addr);
        const bv = b & 0xff;
        readData = unsigned ? bv : ((((bv << 24) >> 24) >>> 0) >>> 0);
      }
    }

    this.readDataUpdate(readData >>> 0);
  }

  /** Initialize RAM (e.g. `.data` segment at load time). Big-endian bytes per word. */
  seedBytes(baseAddress: number, bytes: number[]): void {
    const base = baseAddress >>> 0;
    for (let i = 0; i < bytes.length; i++) {
      writeByteBE(this.dataMemory, base + i, bytes[i]! & 0xff);
    }
  }

  readByteDirect(addr: number): number {
    return readByteBE(this.dataMemory, addr >>> 0);
  }

  commit() {
    if (!this.MemWriteValue) return;

    const addr = this.addressValue >>> 0;
    const wdata = this.writeDataValue >>> 0;
    const memWidth = (this.MemWidthValue ?? 0) as MemWidth;

    if (this.mmio && isMmioAddress(addr)) {
      this.mmio.writeMem(addr, wdata, memWidth);
      return;
    }

    if (memWidth === 0) {
      writeWord(this.dataMemory, alignWord(addr), wdata);
    } else if (memWidth === 1) {
      writeHalfBE(this.dataMemory, addr, wdata & 0xffff);
    } else {
      writeByteBE(this.dataMemory, addr, wdata & 0xff);
    }
  }
}
