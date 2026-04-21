import Component from './Component';

/** PCSrc = Branch && branchCondition (beq/bne use ALU zero; blez/bgtz use rs). */
export default class PCSrcLogic extends Component {
  static inputs = ['branch', 'branchNe', 'zero', 'branchLez', 'branchGtz', 'readData1'];
  static outputs = ['pcSrc'];

  update() {
    const b = !!this.branchValue;
    if (!b) {
      this.pcSrcUpdate(0);
      return;
    }

    const ne = !!this.branchNeValue;
    const z = this.zeroValue === true || this.zeroValue === 1;
    const lez = !!this.branchLezValue;
    const gtz = !!this.branchGtzValue;

    let cond = false;
    if (lez) {
      cond = (this.readData1Value | 0) <= 0;
    } else if (gtz) {
      cond = (this.readData1Value | 0) > 0;
    } else {
      cond = ne ? !z : z;
    }

    this.pcSrcUpdate(cond ? 1 : 0);
  }
}
