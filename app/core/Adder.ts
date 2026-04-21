import Component from './Component';

export default class Adder extends Component {
  static inputs = ['a', 'b'];
  static outputs = ['output'];

  update() {
    this.outputUpdate(this.aValue + this.bValue);
  }
}
