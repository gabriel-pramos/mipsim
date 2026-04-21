import Component from './Component';
import { registerNameToNumber } from '../utils/registerMap';

export default class RegisterFile extends Component {
  static inputs = ['readRegister1', 'readRegister2', 'writeRegister', 'writeData', 'RegWrite'];
  static outputs = ['readData1', 'readData2'];

  registers: number[] = new Array(32).fill(0);

  read(register: number | string): number {
    if (typeof register === 'string') {
      register = registerNameToNumber(register);
    }
    return this.registers[register] || 0;
  }

  write(register: number | string, value: number) {
    if (typeof register === 'string') {
      register = registerNameToNumber(register);
    }
    if (register !== 0) {
      this.registers[register] = value;
    }
  }

  update() {
    const readData1 = this.read(this.readRegister1Value);
    const readData2 = this.read(this.readRegister2Value);

    this.readData1Update(readData1);
    this.readData2Update(readData2);
  }

  writeDataInput(_value: any) {
  }

  writeRegisterInput(_value: any) {
  }

  RegWriteInput(_value: any) {
  }

  commit() {
    if (this.RegWriteValue) {
      this.write(this.writeRegisterValue, this.writeDataValue >>> 0);
    }
  }
}
