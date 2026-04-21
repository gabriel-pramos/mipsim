import Component from './Component';

export default class ShiftLeft2 extends Component {
  static inputs = ['signExtended'];
  static outputs = ['shifted'];

  update() {
    const shifted = (this.signExtendedValue << 2) | 0;
    this.shiftedUpdate(shifted);
  }
}
