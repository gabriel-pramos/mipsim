import Component from './Component';

export default class AND extends Component {
  static inputs = ['input1', 'input2'];
  static outputs = ['output'];

  update() {
    const result = this.input1Value && this.input2Value ? 1 : 0;
    this.outputUpdate(result);
  }
}
