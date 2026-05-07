import type * as Monaco from 'monaco-editor';

export const MIPS_LANGUAGE_ID = 'mips';
export const MIPS_THEME_ID = 'mipsim-light';

const R_TYPE_INSTRUCTIONS = [
  'add', 'addu', 'sub', 'subu', 'and', 'or', 'xor', 'nor',
  'slt', 'sltu', 'sll', 'srl', 'sra', 'sllv', 'srlv', 'srav',
  'mult', 'multu', 'div', 'divu', 'mfhi', 'mflo', 'jr', 'jalr',
  'mul',
] as const;

const I_TYPE_INSTRUCTIONS = [
  'addi', 'addiu', 'andi', 'ori', 'xori', 'slti', 'sltiu', 'lui',
  'beq', 'bne', 'blez', 'bgtz', 'bltz', 'bgez',
  'lw', 'lh', 'lhu', 'lb', 'lbu', 'sw', 'sh', 'sb',
] as const;

const J_TYPE_INSTRUCTIONS = ['j', 'jal'] as const;

const SPECIAL_INSTRUCTIONS = ['syscall', 'eret', 'nop'] as const;

const COP0_INSTRUCTIONS = ['mfc0', 'mtc0'] as const;

const PSEUDO_INSTRUCTIONS = ['li', 'la', 'move'] as const;

const ALL_REAL_INSTRUCTIONS: string[] = [
  ...R_TYPE_INSTRUCTIONS,
  ...I_TYPE_INSTRUCTIONS,
  ...J_TYPE_INSTRUCTIONS,
  ...SPECIAL_INSTRUCTIONS,
  ...COP0_INSTRUCTIONS,
];

const DIRECTIVES = [
  '.text', '.data', '.ktext', '.kdata', '.globl', '.global',
  '.word', '.half', '.byte', '.asciiz', '.ascii', '.space', '.align',
] as const;

const NAMED_REGISTERS = [
  '$zero', '$at',
  '$v0', '$v1',
  '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7', '$t8', '$t9',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$k0', '$k1',
  '$gp', '$sp', '$fp', '$ra',
] as const;

const NUMBERED_REGISTERS = Array.from({ length: 32 }, (_, i) => `$${i}`);

const ALL_REGISTERS = [...NAMED_REGISTERS, ...NUMBERED_REGISTERS];

const REGISTER_DESCRIPTIONS: Record<string, string> = {
  '$zero': 'Constant 0',
  '$at': 'Assembler temporary (reserved)',
  '$v0': 'Return value / syscall code',
  '$v1': 'Return value (high)',
  '$a0': 'Argument 0',
  '$a1': 'Argument 1',
  '$a2': 'Argument 2',
  '$a3': 'Argument 3',
  '$gp': 'Global pointer',
  '$sp': 'Stack pointer',
  '$fp': 'Frame pointer',
  '$ra': 'Return address',
  '$k0': 'Kernel-reserved 0',
  '$k1': 'Kernel-reserved 1',
};
for (let i = 0; i <= 9; i++) REGISTER_DESCRIPTIONS[`$t${i}`] = `Temporary t${i} (caller-saved)`;
for (let i = 0; i <= 7; i++) REGISTER_DESCRIPTIONS[`$s${i}`] = `Saved s${i} (callee-saved)`;

interface InstructionDoc {
  syntax: string;
  summary: string;
  snippet: string;
}

const INSTRUCTION_DOCS: Record<string, InstructionDoc> = {
  add:    { syntax: 'add $rd, $rs, $rt',         summary: 'Add (with overflow trap).',                                snippet: 'add ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  addu:   { syntax: 'addu $rd, $rs, $rt',        summary: 'Add unsigned (no overflow trap).',                          snippet: 'addu ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  sub:    { syntax: 'sub $rd, $rs, $rt',         summary: 'Subtract (with overflow trap).',                            snippet: 'sub ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  subu:   { syntax: 'subu $rd, $rs, $rt',        summary: 'Subtract unsigned (no overflow trap).',                     snippet: 'subu ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  and:    { syntax: 'and $rd, $rs, $rt',         summary: 'Bitwise AND.',                                              snippet: 'and ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  or:     { syntax: 'or $rd, $rs, $rt',          summary: 'Bitwise OR.',                                               snippet: 'or ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  xor:    { syntax: 'xor $rd, $rs, $rt',         summary: 'Bitwise XOR.',                                              snippet: 'xor ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  nor:    { syntax: 'nor $rd, $rs, $rt',         summary: 'Bitwise NOR.',                                              snippet: 'nor ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  slt:    { syntax: 'slt $rd, $rs, $rt',         summary: 'Set on less than (signed).',                                snippet: 'slt ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  sltu:   { syntax: 'sltu $rd, $rs, $rt',        summary: 'Set on less than (unsigned).',                              snippet: 'sltu ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },
  sll:    { syntax: 'sll $rd, $rt, shamt',       summary: 'Shift left logical by immediate.',                          snippet: 'sll ${1:\\$rd}, ${2:\\$rt}, ${3:shamt}' },
  srl:    { syntax: 'srl $rd, $rt, shamt',       summary: 'Shift right logical by immediate.',                         snippet: 'srl ${1:\\$rd}, ${2:\\$rt}, ${3:shamt}' },
  sra:    { syntax: 'sra $rd, $rt, shamt',       summary: 'Shift right arithmetic by immediate.',                      snippet: 'sra ${1:\\$rd}, ${2:\\$rt}, ${3:shamt}' },
  sllv:   { syntax: 'sllv $rd, $rt, $rs',        summary: 'Shift left logical by variable.',                           snippet: 'sllv ${1:\\$rd}, ${2:\\$rt}, ${3:\\$rs}' },
  srlv:   { syntax: 'srlv $rd, $rt, $rs',        summary: 'Shift right logical by variable.',                          snippet: 'srlv ${1:\\$rd}, ${2:\\$rt}, ${3:\\$rs}' },
  srav:   { syntax: 'srav $rd, $rt, $rs',        summary: 'Shift right arithmetic by variable.',                       snippet: 'srav ${1:\\$rd}, ${2:\\$rt}, ${3:\\$rs}' },
  mult:   { syntax: 'mult $rs, $rt',             summary: 'Multiply signed; result in HI/LO.',                         snippet: 'mult ${1:\\$rs}, ${2:\\$rt}' },
  multu:  { syntax: 'multu $rs, $rt',            summary: 'Multiply unsigned; result in HI/LO.',                       snippet: 'multu ${1:\\$rs}, ${2:\\$rt}' },
  div:    { syntax: 'div $rs, $rt',              summary: 'Divide signed; quotient in LO, remainder in HI.',           snippet: 'div ${1:\\$rs}, ${2:\\$rt}' },
  divu:   { syntax: 'divu $rs, $rt',             summary: 'Divide unsigned; quotient in LO, remainder in HI.',         snippet: 'divu ${1:\\$rs}, ${2:\\$rt}' },
  mfhi:   { syntax: 'mfhi $rd',                  summary: 'Move from HI register.',                                    snippet: 'mfhi ${1:\\$rd}' },
  mflo:   { syntax: 'mflo $rd',                  summary: 'Move from LO register.',                                    snippet: 'mflo ${1:\\$rd}' },
  jr:     { syntax: 'jr $rs',                    summary: 'Jump register (often used as `jr $ra`).',                   snippet: 'jr ${1:\\$ra}' },
  jalr:   { syntax: 'jalr $rd, $rs',             summary: 'Jump and link register.',                                   snippet: 'jalr ${1:\\$rd}, ${2:\\$rs}' },
  mul:    { syntax: 'mul $rd, $rs, $rt',         summary: 'Multiply, result low 32 bits to $rd.',                       snippet: 'mul ${1:\\$rd}, ${2:\\$rs}, ${3:\\$rt}' },

  addi:   { syntax: 'addi $rt, $rs, imm',        summary: 'Add immediate (with overflow trap).',                       snippet: 'addi ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  addiu:  { syntax: 'addiu $rt, $rs, imm',       summary: 'Add immediate unsigned (no overflow trap).',                snippet: 'addiu ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  andi:   { syntax: 'andi $rt, $rs, imm',        summary: 'AND immediate (zero-extended).',                            snippet: 'andi ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  ori:    { syntax: 'ori $rt, $rs, imm',         summary: 'OR immediate (zero-extended).',                             snippet: 'ori ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  xori:   { syntax: 'xori $rt, $rs, imm',        summary: 'XOR immediate (zero-extended).',                            snippet: 'xori ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  slti:   { syntax: 'slti $rt, $rs, imm',        summary: 'Set on less than immediate (signed).',                      snippet: 'slti ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  sltiu:  { syntax: 'sltiu $rt, $rs, imm',       summary: 'Set on less than immediate (unsigned).',                    snippet: 'sltiu ${1:\\$rt}, ${2:\\$rs}, ${3:imm}' },
  lui:    { syntax: 'lui $rt, imm',              summary: 'Load upper immediate (high 16 bits, zero-fill low).',       snippet: 'lui ${1:\\$rt}, ${2:imm}' },
  beq:    { syntax: 'beq $rs, $rt, label',       summary: 'Branch if equal.',                                          snippet: 'beq ${1:\\$rs}, ${2:\\$rt}, ${3:label}' },
  bne:    { syntax: 'bne $rs, $rt, label',       summary: 'Branch if not equal.',                                      snippet: 'bne ${1:\\$rs}, ${2:\\$rt}, ${3:label}' },
  blez:   { syntax: 'blez $rs, label',           summary: 'Branch if less than or equal to zero.',                     snippet: 'blez ${1:\\$rs}, ${2:label}' },
  bgtz:   { syntax: 'bgtz $rs, label',           summary: 'Branch if greater than zero.',                              snippet: 'bgtz ${1:\\$rs}, ${2:label}' },
  bltz:   { syntax: 'bltz $rs, label',           summary: 'Branch if less than zero.',                                 snippet: 'bltz ${1:\\$rs}, ${2:label}' },
  bgez:   { syntax: 'bgez $rs, label',           summary: 'Branch if greater than or equal to zero.',                  snippet: 'bgez ${1:\\$rs}, ${2:label}' },
  lw:     { syntax: 'lw $rt, offset($rs)',       summary: 'Load word from memory.',                                    snippet: 'lw ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  lh:     { syntax: 'lh $rt, offset($rs)',       summary: 'Load halfword (sign-extended).',                            snippet: 'lh ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  lhu:    { syntax: 'lhu $rt, offset($rs)',      summary: 'Load halfword unsigned (zero-extended).',                   snippet: 'lhu ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  lb:     { syntax: 'lb $rt, offset($rs)',       summary: 'Load byte (sign-extended).',                                snippet: 'lb ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  lbu:    { syntax: 'lbu $rt, offset($rs)',      summary: 'Load byte unsigned (zero-extended).',                       snippet: 'lbu ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  sw:     { syntax: 'sw $rt, offset($rs)',       summary: 'Store word.',                                               snippet: 'sw ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  sh:     { syntax: 'sh $rt, offset($rs)',       summary: 'Store halfword.',                                           snippet: 'sh ${1:\\$rt}, ${2:0}(${3:\\$rs})' },
  sb:     { syntax: 'sb $rt, offset($rs)',       summary: 'Store byte.',                                               snippet: 'sb ${1:\\$rt}, ${2:0}(${3:\\$rs})' },

  j:      { syntax: 'j label',                   summary: 'Unconditional jump.',                                       snippet: 'j ${1:label}' },
  jal:    { syntax: 'jal label',                 summary: 'Jump and link (call subroutine, $ra = PC+4).',              snippet: 'jal ${1:label}' },

  syscall:{ syntax: 'syscall',                   summary: 'System call (code in $v0; args in $a0-$a3).',               snippet: 'syscall' },
  eret:   { syntax: 'eret',                      summary: 'Exception return (restore PC from EPC).',                   snippet: 'eret' },
  nop:    { syntax: 'nop',                       summary: 'No operation (encoded as `sll $0, $0, 0`).',                snippet: 'nop' },

  mfc0:   { syntax: 'mfc0 $rt, $n',              summary: 'Move from CP0 register n into $rt.',                        snippet: 'mfc0 ${1:\\$rt}, ${2:\\$12}' },
  mtc0:   { syntax: 'mtc0 $rt, $n',              summary: 'Move to CP0 register n from $rt.',                          snippet: 'mtc0 ${1:\\$rt}, ${2:\\$12}' },

  li:     { syntax: 'li $rt, imm',               summary: 'Pseudo: load immediate (expands to addiu/lui+ori).',        snippet: 'li ${1:\\$rt}, ${2:imm}' },
  la:     { syntax: 'la $rt, label',             summary: 'Pseudo: load address of label/symbol.',                     snippet: 'la ${1:\\$rt}, ${2:label}' },
  move:   { syntax: 'move $rd, $rs',             summary: 'Pseudo: copy register (expands to `addu $rd, $rs, $zero`).', snippet: 'move ${1:\\$rd}, ${2:\\$rs}' },
};

const DIRECTIVE_DOCS: Record<string, string> = {
  '.text': 'Begin user text (code) segment.',
  '.data': 'Begin data segment.',
  '.ktext': 'Begin kernel text segment (e.g. `.ktext 0x80000180`).',
  '.kdata': 'Begin kernel data segment.',
  '.globl': 'Declare a global symbol.',
  '.global': 'Alias for `.globl`.',
  '.word': 'Reserve and initialize 32-bit word(s).',
  '.half': 'Reserve and initialize 16-bit halfword(s).',
  '.byte': 'Reserve and initialize 8-bit byte(s).',
  '.asciiz': 'NUL-terminated ASCII string.',
  '.ascii': 'ASCII string (no terminator).',
  '.space': 'Reserve N bytes of zeroed space.',
  '.align': 'Align next datum to 2^n boundary.',
};

let registered = false;

export function registerMipsLanguage(monaco: typeof Monaco): void {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: MIPS_LANGUAGE_ID, extensions: ['.s', '.asm', '.mips'] });

  monaco.languages.setLanguageConfiguration(MIPS_LANGUAGE_ID, {
    comments: { lineComment: '#' },
    brackets: [['(', ')'], ['[', ']']],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
  });

  monaco.languages.setMonarchTokensProvider(MIPS_LANGUAGE_ID, {
    defaultToken: '',
    ignoreCase: false,
    instructions: ALL_REAL_INSTRUCTIONS,
    pseudo: PSEUDO_INSTRUCTIONS as unknown as string[],
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/^\s*[A-Za-z_][\w]*\s*:/, 'type.label'],
        [/\.[A-Za-z_]\w*/, 'keyword.directive'],
        [/\$(?:zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|k[01]|gp|sp|fp|ra|\d{1,2})\b/, 'variable.register'],
        [/[A-Za-z_]\w*/, {
          cases: {
            '@instructions': 'keyword.instruction',
            '@pseudo': 'keyword.pseudo',
            '@default': 'identifier',
          },
        }],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/-?\d+/, 'number'],
        [/"/, { token: 'string.quote', next: '@string' }],
        [/[(),]/, 'delimiter'],
        [/\s+/, 'white'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', next: '@pop' }],
      ],
    },
  } as Monaco.languages.IMonarchLanguage);

  monaco.editor.defineTheme(MIPS_THEME_ID, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment',             foreground: '71717a', fontStyle: 'italic' },
      { token: 'keyword.instruction', foreground: '7c3aed', fontStyle: 'bold' },
      { token: 'keyword.pseudo',      foreground: 'a21caf', fontStyle: 'bold' },
      { token: 'keyword.directive',   foreground: 'b45309' },
      { token: 'variable.register',   foreground: '0e7490' },
      { token: 'type.label',          foreground: '0f766e', fontStyle: 'bold' },
      { token: 'number',              foreground: '1d4ed8' },
      { token: 'number.hex',          foreground: '1d4ed8' },
      { token: 'string',              foreground: '15803d' },
      { token: 'string.quote',        foreground: '15803d' },
      { token: 'string.escape',       foreground: '0d9488' },
      { token: 'delimiter',           foreground: '52525b' },
    ],
    colors: {
      'editor.background':           '#fafafa',
      'editor.foreground':           '#18181b',
      'editorLineNumber.foreground': '#a1a1aa',
      'editorLineNumber.activeForeground': '#52525b',
      'editor.lineHighlightBackground': '#f4f4f5',
      'editor.selectionBackground':  '#e4e4e7',
      'editorCursor.foreground':     '#18181b',
      'editorIndentGuide.background1': '#e4e4e7',
      'editorBracketMatch.background': '#e4e4e7',
      'editorBracketMatch.border':     '#a1a1aa',
    },
  });

  monaco.languages.registerCompletionItemProvider(MIPS_LANGUAGE_ID, {
    triggerCharacters: ['.', '$'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range: Monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const lineContent = model.getLineContent(position.lineNumber);
      const charBefore = position.column >= 2 ? lineContent.charAt(position.column - 2) : '';
      const dollarRange: Monaco.IRange = charBefore === '$'
        ? { ...range, startColumn: range.startColumn - 1 }
        : range;
      const dotRange: Monaco.IRange = charBefore === '.'
        ? { ...range, startColumn: range.startColumn - 1 }
        : range;

      const suggestions: Monaco.languages.CompletionItem[] = [];

      for (const op of ALL_REAL_INSTRUCTIONS) {
        const doc = INSTRUCTION_DOCS[op];
        suggestions.push({
          label: op,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: doc?.snippet ?? op,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: doc
            ? { value: `**${op}** — ${doc.summary}\n\n\`${doc.syntax}\`` }
            : undefined,
          detail: doc?.syntax,
          sortText: `1_${op}`,
          range,
        });
      }

      for (const op of PSEUDO_INSTRUCTIONS) {
        const doc = INSTRUCTION_DOCS[op];
        suggestions.push({
          label: op,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: doc?.snippet ?? op,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: doc
            ? { value: `**${op}** *(pseudo)* — ${doc.summary}\n\n\`${doc.syntax}\`` }
            : undefined,
          detail: doc?.syntax,
          sortText: `2_${op}`,
          range,
        });
      }

      for (const reg of ALL_REGISTERS) {
        suggestions.push({
          label: reg,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: reg,
          documentation: REGISTER_DESCRIPTIONS[reg],
          sortText: `0_${reg}`,
          range: dollarRange,
        });
      }

      for (const dir of DIRECTIVES) {
        suggestions.push({
          label: dir,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: dir,
          documentation: DIRECTIVE_DOCS[dir],
          sortText: `3_${dir}`,
          range: dotRange,
        });
      }

      const labels = collectLabels(model);
      const seen = new Set<string>();
      for (const { name } of labels) {
        if (seen.has(name)) continue;
        seen.add(name);
        suggestions.push({
          label: name,
          kind: monaco.languages.CompletionItemKind.Reference,
          insertText: name,
          detail: 'label',
          sortText: `4_${name}`,
          range,
        });
      }

      return { suggestions };
    },
  });

  monaco.languages.registerHoverProvider(MIPS_LANGUAGE_ID, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const lineContent = model.getLineContent(position.lineNumber);
      const before = lineContent.charAt(word.startColumn - 2);

      if (before === '$') {
        const reg = `$${word.word}`;
        if (REGISTER_DESCRIPTIONS[reg]) {
          return {
            range: rangeOfWord(position.lineNumber, word.startColumn - 1, word.endColumn),
            contents: [{ value: `**${reg}** — ${REGISTER_DESCRIPTIONS[reg]}` }],
          };
        }
      }
      if (before === '.') {
        const dir = `.${word.word}`;
        if (DIRECTIVE_DOCS[dir]) {
          return {
            range: rangeOfWord(position.lineNumber, word.startColumn - 1, word.endColumn),
            contents: [{ value: `**${dir}** — ${DIRECTIVE_DOCS[dir]}` }],
          };
        }
      }
      const doc = INSTRUCTION_DOCS[word.word];
      if (doc) {
        const isPseudo = (PSEUDO_INSTRUCTIONS as readonly string[]).includes(word.word);
        return {
          range: rangeOfWord(position.lineNumber, word.startColumn, word.endColumn),
          contents: [
            { value: `**${word.word}**${isPseudo ? ' *(pseudo)*' : ''} — ${doc.summary}` },
            { value: `\`${doc.syntax}\`` },
          ],
        };
      }

      const labels = collectLabels(model);
      const hit = labels.find((l) => l.name === word.word);
      if (hit) {
        return {
          range: rangeOfWord(position.lineNumber, word.startColumn, word.endColumn),
          contents: [{ value: `**${word.word}** — label defined on line ${hit.line}` }],
        };
      }
      return null;
    },
  });

  monaco.languages.registerDefinitionProvider(MIPS_LANGUAGE_ID, {
    provideDefinition(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const labels = collectLabels(model);
      const hit = labels.find((l) => l.name === word.word);
      if (!hit) return null;
      return {
        uri: model.uri,
        range: {
          startLineNumber: hit.line,
          endLineNumber: hit.line,
          startColumn: hit.column,
          endColumn: hit.column + hit.name.length,
        },
      };
    },
  });
}

interface LabelLocation {
  name: string;
  line: number;
  column: number;
}

function collectLabels(model: Monaco.editor.ITextModel): LabelLocation[] {
  const labels: LabelLocation[] = [];
  const lineCount = model.getLineCount();
  const re = /^(\s*)([A-Za-z_]\w*)\s*:/;
  for (let line = 1; line <= lineCount; line++) {
    const text = model.getLineContent(line);
    const m = re.exec(text);
    if (m) {
      labels.push({
        name: m[2],
        line,
        column: (m[1]?.length ?? 0) + 1,
      });
    }
  }
  return labels;
}

function rangeOfWord(line: number, startColumn: number, endColumn: number): Monaco.IRange {
  return {
    startLineNumber: line,
    endLineNumber: line,
    startColumn,
    endColumn,
  };
}

export interface ApplyParseErrorMarkerArgs {
  monaco: typeof Monaco;
  editor: Monaco.editor.IStandaloneCodeEditor;
  message: string;
}

export function applyParseErrorMarker({ monaco, editor, message }: ApplyParseErrorMarkerArgs): void {
  const model = editor.getModel();
  if (!model) return;

  let line = 1;
  let column = 1;
  let endColumn = model.getLineMaxColumn(1);

  const lineMatch = /Parse error on line (\d+)/i.exec(message);
  if (lineMatch) {
    line = clampLine(parseInt(lineMatch[1], 10), model);
    endColumn = model.getLineMaxColumn(line);
  } else {
    const undefMatch = /Undefined label:\s*(\w+)/i.exec(message);
    if (undefMatch) {
      const target = undefMatch[1];
      const found = findFirstUseOfWord(model, target);
      if (found) {
        line = found.line;
        column = found.column;
        endColumn = column + target.length;
      }
    } else {
      const dupMatch = /Duplicate text label:\s*(\w+)/i.exec(message);
      if (dupMatch) {
        const target = dupMatch[1];
        const found = findFirstUseOfWord(model, target);
        if (found) {
          line = found.line;
          column = found.column;
          endColumn = column + target.length;
        }
      }
    }
  }

  monaco.editor.setModelMarkers(model, MIPS_MARKER_OWNER, [
    {
      severity: monaco.MarkerSeverity.Error,
      message,
      startLineNumber: line,
      startColumn: column,
      endLineNumber: line,
      endColumn,
    },
  ]);
}

export const MIPS_MARKER_OWNER = 'mipsim';

export function clearParseErrorMarkers(monaco: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor): void {
  const model = editor.getModel();
  if (!model) return;
  monaco.editor.setModelMarkers(model, MIPS_MARKER_OWNER, []);
}

function clampLine(line: number, model: Monaco.editor.ITextModel): number {
  if (!Number.isFinite(line) || line < 1) return 1;
  const total = model.getLineCount();
  return line > total ? total : line;
}

function findFirstUseOfWord(
  model: Monaco.editor.ITextModel,
  word: string,
): { line: number; column: number } | null {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`);
  const total = model.getLineCount();
  for (let line = 1; line <= total; line++) {
    const text = model.getLineContent(line);
    const m = re.exec(text);
    if (m && m.index !== undefined) {
      return { line, column: m.index + 1 };
    }
  }
  return null;
}
