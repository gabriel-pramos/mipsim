import Component from './Component';

export default class ProgramCounter extends Component {
  static inputs = ['input'];
  static outputs = ['PC'];

  PC: number = 0;

  clock() {
    if (this.inputValue !== undefined && this.inputValue !== 0) {
      this.PC = this.inputValue;
    }
    this.PCUpdate(this.PC);
  }

  reset() {
    this.PC = 0;
    this.PCUpdate(this.PC);
  }
}
