interface MIPSParser {
  parse(input: string): any;
  yy?: any;
}

declare const mips: {
  parser: MIPSParser;
  Parser: any;
  parse: (input: string) => any;
  main: (args: string[]) => void;
};

export default mips;
