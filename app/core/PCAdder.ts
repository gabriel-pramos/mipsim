import Component from './Component';

export default class PCAdder extends Component {
  static inputs = ['PC'];
  static outputs = ['nextPC'];

  update() {
    this.nextPCUpdate(this.PCValue + 4);
  }
}
