import Component from './Component';

export default class SignExtender extends Component {
  static inputs = ['immediate'];
  static outputs = ['signExtended'];

  update() {
    const signExtended =
      this.immediateValue & 0x8000
        ? this.immediateValue | 0xffff0000
        : this.immediateValue & 0x0000ffff;

    this.signExtendedUpdate(signExtended);
  }
}
