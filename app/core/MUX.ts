import Component from './Component';

export default class MUX extends Component {
  static inputs = ['input0', 'input1', 'selector'];
  static outputs = ['output'];

  update() {
    const result = this.selectorValue ? this.input1Value : this.input0Value;
    this.outputUpdate(result);
  }
}
