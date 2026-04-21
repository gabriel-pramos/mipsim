interface ConnectionTarget {
  component: Component;
  input: string;
}

export default class Component {
  static inputs: string[] = [];
  static outputs: string[] = [];

  _connections: Record<string, ConnectionTarget[]> = {};
  _outputData: Record<string, any> = {};
  [key: string]: any;

  constructor() {
    const ctor = this.constructor as typeof Component;

    ctor.inputs.forEach((input) => {
      this[`${input}Value`] = 0;
    });

    ctor.outputs.forEach((output) => {
      this._outputData[output] = 0;
      this._connections[output] = [];

      this[`${output}Update`] = (value: any) => {
        this._outputData[output] = value;
        this._propagateOutput(output, value);
      };

      this[`${output}Get`] = () => {
        return this._outputData[output];
      };
    });
  }

  connect(outputName: string, targetComponent: Component, inputName: string) {
    if (!this._connections[outputName]) {
      throw new Error(`Output ${outputName} does not exist`);
    }
    this._connections[outputName].push({
      component: targetComponent,
      input: inputName,
    });
  }

  _propagateOutput(outputName: string, value: any) {
    this._connections[outputName].forEach((connection) => {
      connection.component._receiveInput(connection.input, value);
    });
  }

  _receiveInput(inputName: string, value: any) {
    this[`${inputName}Value`] = value;

    const inputMethod = `${inputName}Input`;
    if (typeof this[inputMethod] === 'function') {
      this[inputMethod](value);
    } else if (typeof this.update === 'function') {
      this.update();
    }
  }

  getOutput(name: string): any {
    return this._outputData[name];
  }

  setInput(name: string, value: any) {
    this._receiveInput(name, value);
  }

  update?(): void;

  display(): string {
    const ctor = this.constructor as typeof Component;

    const inputs = ctor.inputs
      .map((input) => {
        const val = this[`${input}Value`];
        const hex =
          typeof val === 'number' && !isNaN(val)
            ? '0x' + val.toString(16)
            : val;
        return `${input}: ${hex}`;
      })
      .join(', ');

    const outputs = ctor.outputs
      .map((output) => {
        const val = this._outputData[output];
        const hex =
          typeof val === 'number' && !isNaN(val)
            ? '0x' + val.toString(16)
            : val;
        return `${output}: ${hex}`;
      })
      .join(', ');

    return `${ctor.name} Inputs: { ${inputs} } Outputs: { ${outputs} }`;
  }
}
