%option locations

%{
let nextId = 1;
function genId() {
  return nextId++;
}
%}

%lex

%%
"\n"                    return 'NEWLINE'
\n                      return 'NEWLINE'
\s+                     /* skip whitespace */
"#"[^\r\n]*             /* skip comments */
"//"[^\r\n]*            /* skip comments */

/* Registers */
"$zero"                 return 'REGISTER'
"$0"                    return 'REGISTER'
"$at"                   return 'REGISTER'
"$1"                    return 'REGISTER'
"$v0"                   return 'REGISTER'
"$2"                    return 'REGISTER'
"$v1"                   return 'REGISTER'
"$3"                    return 'REGISTER'
"$a0"                   return 'REGISTER'
"$4"                    return 'REGISTER'
"$a1"                   return 'REGISTER'
"$5"                    return 'REGISTER'
"$a2"                   return 'REGISTER'
"$6"                    return 'REGISTER'
"$a3"                   return 'REGISTER'
"$7"                    return 'REGISTER'
"$t0"                   return 'REGISTER'
"$8"                    return 'REGISTER'
"$t0"                   return 'REGISTER'
"$8"                    return 'REGISTER'
"$t1"                   return 'REGISTER'
"$9"                    return 'REGISTER'
"$t2"                   return 'REGISTER'
"$10"                   return 'REGISTER'
"$t3"                   return 'REGISTER'
"$11"                   return 'REGISTER'
"$t4"                   return 'REGISTER'
"$12"                   return 'REGISTER'
"$t5"                   return 'REGISTER'
"$13"                   return 'REGISTER'
"$t6"                   return 'REGISTER'
"$14"                   return 'REGISTER'
"$t7"                   return 'REGISTER'
"$15"                   return 'REGISTER'
"$s0"                   return 'REGISTER'
"$16"                   return 'REGISTER'
"$s1"                   return 'REGISTER'
"$17"                   return 'REGISTER'
"$s2"                   return 'REGISTER'
"$18"                   return 'REGISTER'
"$s3"                   return 'REGISTER'
"$19"                   return 'REGISTER'
"$s4"                   return 'REGISTER'
"$20"                   return 'REGISTER'
"$s5"                   return 'REGISTER'
"$21"                   return 'REGISTER'
"$s6"                   return 'REGISTER'
"$22"                   return 'REGISTER'
"$s7"                   return 'REGISTER'
"$23"                   return 'REGISTER'
"$t8"                   return 'REGISTER'
"$24"                   return 'REGISTER'
"$t9"                   return 'REGISTER'
"$25"                   return 'REGISTER'
"$k0"                   return 'REGISTER'
"$26"                   return 'REGISTER'
"$k1"                   return 'REGISTER'
"$27"                   return 'REGISTER'
"$gp"                   return 'REGISTER'
"$28"                   return 'REGISTER'
"$sp"                   return 'REGISTER'
"$29"                   return 'REGISTER'
"$fp"                   return 'REGISTER'
"$30"                   return 'REGISTER'
"$ra"                   return 'REGISTER'
"$31"                   return 'REGISTER'

/* Instructions */
"add"                   return 'ADD'
"addi"                  return 'ADDI'
"addiu"                 return 'ADDIU'
"addu"                  return 'ADDU'
"and"                   return 'AND'
"andi"                  return 'ANDI'
"beq"                   return 'BEQ'
"bne"                   return 'BNE'
"blez"                  return 'BLEZ'
"bgtz"                  return 'BGTZ'
"bltz"                  return 'BLTZ'
"bgez"                  return 'BGEZ'
"bltzal"                return 'BLTZAL'
"bgezal"                return 'BGEZAL'
"div"                   return 'DIV'
"divu"                  return 'DIVU'
"j"                     return 'J'
"jal"                   return 'JAL'
"jalr"                  return 'JALR'
"jr"                    return 'JR'
"lb"                    return 'LB'
"lbu"                   return 'LBU'
"lh"                    return 'LH'
"lhu"                   return 'LHU'
"lw"                    return 'LW'
"lui"                   return 'LUI'
"mfhi"                  return 'MFHI'
"mflo"                  return 'MFLO'
"mthi"                  return 'MTHI'
"mtlo"                  return 'MTLO'
"mul"                   return 'MUL'
"mult"                  return 'MULT'
"multu"                 return 'MULTU'
"nor"                   return 'NOR'
"or"                    return 'OR'
"ori"                   return 'ORI'
"sb"                    return 'SB'
"sh"                    return 'SH'
"sll"                   return 'SLL'
"sllv"                  return 'SLLV'
"slt"                   return 'SLT'
"slti"                  return 'SLTI'
"sltu"                  return 'SLTU'
"sltiu"                 return 'SLTIU'
"sra"                   return 'SRA'
"srav"                  return 'SRAV'
"srl"                   return 'SRL'
"srlv"                  return 'SRLV'
"sub"                   return 'SUB'
"subu"                  return 'SUBU'
"sw"                    return 'SW'
"syscall"               return 'SYSCALL'
"mfc0"                  return 'MFC0'
"mtc0"                  return 'MTC0'
"eret"                  return 'ERET'
"xor"                   return 'XOR'
"xori"                  return 'XORI'
"nop"                   return 'NOP'
"li"                    return 'LI'
"la"                    return 'LA'
"move"                  return 'MOVE'

".data"                return 'DATA'
".text"                return 'TEXT'
".ktext"               return 'KTEXT'
".globl"               return 'GLOBL'
".asciiz"              return 'ASCIIZ'
".word"                return 'WORD'

/* Numbers — hex/binary before decimal so 0xffff is not lexed as 0 + identifier */
"0x"[0-9a-fA-F]+        return 'HEX_NUMBER'
"0X"[0-9a-fA-F]+        return 'HEX_NUMBER'
"0b"[01]+               return 'BINARY_NUMBER'
"0B"[01]+               return 'BINARY_NUMBER'
"-"?[0-9]+              return 'NUMBER'
"'"[^\']*"'"           return 'CHAR'

/* Labels and Identifiers */
[a-zA-Z_][a-zA-Z0-9_]*  return 'IDENTIFIER'

/* String */
"\""[^\"]*"\""          return 'STRING'

/* Punctuation */
","                     return 'COMMA'
";"                     return 'SEMI'
"("                     return 'LPAREN'
")"                     return 'RPAREN'
":"                     return 'COLON'
<<EOF>>                 return 'EOF'
.                       return 'INVALID'

/lex

/* Grammar Rules */
%start program

%%

/* program
    : statement_list EOF
        { return $1; }
    ; */

program
    : new_line_list segment_list EOF
        { $$ = { id: genId(), type: 'program', data: $2.data, ktextBlocks: $2.ktextBlocks, text: $2.text }; return $$; }
    ;

segment_list
    : segment_list segment
        {
          $$ = {
            data: $1.data.concat($2.data),
            ktextBlocks: $1.ktextBlocks.concat($2.ktextBlocks),
            text: $1.text.concat($2.text)
          };
        }
    | /* empty */
        { $$ = { data: [], ktextBlocks: [], text: [] }; }
    ;

segment
    : data_section
        { $$ = { data: $1, ktextBlocks: [], text: [] }; }
    | text_section
        { $$ = { data: [], ktextBlocks: [], text: $1 }; }
    | ktext_section
        { $$ = { data: [], ktextBlocks: [$1], text: [] }; }
    ;

new_line_list
    : NEWLINE new_line_list
        {  }
    | NEWLINE
        {  }
    | /* empty */
        {  }
    ;

data_section
    : DATA NEWLINE data_statement_list NEWLINE
        { $$ = $3; }
    ;

/* Like text `statement_list`: blank lines and comment-only lines become NEWLINE tokens. */
data_statement_list
    : data_statement_list data_statement
        {
          $$ = $1;
          if ($2 != null) {
            $$.push($2);
          }
        }
    | data_statement
        { $$ = $1 == null ? [] : [$1]; }
    | /* empty */
        { $$ = []; }
    ;

data_statement
    : declaration
        { $$ = $1; }
    | NEWLINE
        { $$ = null; }
    ;

declaration
    : IDENTIFIER COLON ASCIIZ STRING NEWLINE
        { $$ = { id: genId(), label: $1, type: 'asciiz', string: $4 }; }
    | IDENTIFIER COLON WORD word_list NEWLINE
        { $$ = { id: genId(), label: $1, type: 'word', values: $4 }; }
    ;

word_list
    : word_list NUMBER
        { $$ = $1; $$.push(parseInt($2, 10)); }
    | word_list COMMA NUMBER
        { $$ = $1; $$.push(parseInt($3, 10)); }
    | word_list HEX_NUMBER
        { $$ = $1; $$.push(parseInt($2, 16)); }
    | word_list COMMA HEX_NUMBER
        { $$ = $1; $$.push(parseInt($3, 16)); }
    | word_list BINARY_NUMBER
        { $$ = $1; $$.push(parseInt($2, 2)); }
    | word_list COMMA BINARY_NUMBER
        { $$ = $1; $$.push(parseInt($3, 2)); }
    | NUMBER
        { $$ = [parseInt($1, 10)]; }
    | HEX_NUMBER
        { $$ = [parseInt($1, 16)]; }
    | BINARY_NUMBER
        { $$ = [parseInt($1, 2)]; }
    ;

text_section
    : TEXT NEWLINE statement_list
        /* { $$ = { id: genId(), type: 'text_section', statements: $3 }; } */
        { $$ = $3; }
    ;

ktext_section
    : KTEXT NEWLINE statement_list
        { $$ = { address: null, statements: $3 }; }
    | KTEXT HEX_NUMBER NEWLINE statement_list
        { $$ = { address: parseInt($2, 16) >>> 0, statements: $4 }; }
    | KTEXT NUMBER NEWLINE statement_list
        { $$ = { address: parseInt($2, 10) >>> 0, statements: $4 }; }
    ;

statement_list
    : statement_list statement
        { 
            $$ = $1;
            if ($2 != null) {
                if (Array.isArray($2)) {
                    for (let i = 0; i < $2.length; i++) {
                        $$.push($2[i]);
                    }
                } else {
                    $$.push($2);
                }
            }
        }
    | statement
        { $$ = $1 == null ? [] : (Array.isArray($1) ? $1 : [$1]); }
    | /* empty */
        { $$ = []; }
    ;

instruction_sequence
    : instruction
        { $$ = [$1]; }
    | instruction_sequence SEMI instruction
        { $$ = $1; $$.push($3); }
    ;

statement
    : instruction_sequence NEWLINE
        { $$ = $1.length === 1 ? $1[0] : $1; }
    | label new_line_list instruction_sequence NEWLINE
        {
            $3[0].label = $1;
            $$ = $3.length === 1 ? $3[0] : $3;
        }
    | GLOBL IDENTIFIER NEWLINE
        { $$ = { id: genId(), type: 'globl', identifier: $2 }; }
    | NEWLINE
        { $$ = null; }
    ;

label
    : IDENTIFIER COLON
        /* { $$ = { id: genId(), type: 'label', name: $1 }; } */
        { $$ = $1; }
    ;

instruction
    : r_type_instruction
        { $$ = $1; }
    | i_type_instruction
        { $$ = $1; }
    | j_type_instruction
        { $$ = $1; }
    | cop0_instruction
        { $$ = $1; }
    | special_instruction
        { $$ = $1; }
    ;

/* MARS/SPIM: second operand is $n meaning Coprocessor 0 register number n (same token as GPR). */
cop0_instruction
    : MFC0 REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'cop0_type', op: 'mfc0', rt: $2, rd: $4 }; }
    | MTC0 REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'cop0_type', op: 'mtc0', rt: $2, rd: $4 }; }
    ;

r_type_instruction
    : ADD REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'add', rd: $2, rs: $4, rt: $6 }; }
    | ADDU REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'addu', rd: $2, rs: $4, rt: $6 }; }
    | AND REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'and', rd: $2, rs: $4, rt: $6 }; }
    | OR REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'or', rd: $2, rs: $4, rt: $6 }; }
    | XOR REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'xor', rd: $2, rs: $4, rt: $6 }; }
    | NOR REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'nor', rd: $2, rs: $4, rt: $6 }; }
    | SLT REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'slt', rd: $2, rs: $4, rt: $6 }; }
    | SLTU REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'sltu', rd: $2, rs: $4, rt: $6 }; }
    | SUB REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'sub', rd: $2, rs: $4, rt: $6 }; }
    | SUBU REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'subu', rd: $2, rs: $4, rt: $6 }; }
    | SLL REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'r_type', op: 'sll', rd: $2, rt: $4, shamt: $6 }; }
    | SRL REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'r_type', op: 'srl', rd: $2, rt: $4, shamt: $6 }; }
    | SRA REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'r_type', op: 'sra', rd: $2, rt: $4, shamt: $6 }; }
    | SLLV REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'sllv', rd: $2, rt: $4, rs: $6 }; }
    | SRLV REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'srlv', rd: $2, rt: $4, rs: $6 }; }
    | SRAV REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'srav', rd: $2, rt: $4, rs: $6 }; }
    | JR REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'jr', rs: $2 }; }
    | JALR REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'jalr', rs: $2 }; }
    | JALR REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'jalr', rd: $2, rs: $4 }; }
    | MFHI REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mfhi', rd: $2 }; }
    | MFLO REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mflo', rd: $2 }; }
    | MTHI REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mthi', rs: $2 }; }
    | MTLO REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mtlo', rs: $2 }; }
    | MUL REGISTER COMMA REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mul', rd: $2, rs: $4, rt: $6 }; }
    | MULT REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'mult', rs: $2, rt: $4 }; }
    | MULTU REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'multu', rs: $2, rt: $4 }; }
    | DIV REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'div', rs: $2, rt: $4 }; }
    | DIVU REGISTER COMMA REGISTER
        { $$ = { id: genId(), type: 'r_type', op: 'divu', rs: $2, rt: $4 }; }
    ;

i_type_instruction
    : ADDI REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'addi', rt: $2, rs: $4, immediate: $6 }; }
    | ADDIU REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'addiu', rt: $2, rs: $4, immediate: $6 }; }
    | ANDI REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'andi', rt: $2, rs: $4, immediate: $6 }; }
    | ORI REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'ori', rt: $2, rs: $4, immediate: $6 }; }
    | XORI REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'xori', rt: $2, rs: $4, immediate: $6 }; }
    | SLTI REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'slti', rt: $2, rs: $4, immediate: $6 }; }
    | SLTIU REGISTER COMMA REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'sltiu', rt: $2, rs: $4, immediate: $6 }; }
    | LUI REGISTER COMMA immediate
        { $$ = { id: genId(), type: 'i_type', op: 'lui', rt: $2, immediate: $4 }; }
    | BEQ REGISTER COMMA REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'beq', rs: $2, rt: $4, target: $6 }; }
    | BNE REGISTER COMMA REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bne', rs: $2, rt: $4, target: $6 }; }
    | BLEZ REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'blez', rs: $2, target: $4 }; }
    | BGTZ REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bgtz', rs: $2, target: $4 }; }
    | BLTZ REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bltz', rs: $2, target: $4 }; }
    | BGEZ REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bgez', rs: $2, target: $4 }; }
    | BLTZAL REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bltzal', rs: $2, target: $4 }; }
    | BGEZAL REGISTER COMMA target
        { $$ = { id: genId(), type: 'i_type', op: 'bgezal', rs: $2, target: $4 }; }
    | LW REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'lw', rt: $2, base: $4.base, offset: $4.offset }; }
    | LH REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'lh', rt: $2, base: $4.base, offset: $4.offset }; }
    | LHU REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'lhu', rt: $2, base: $4.base, offset: $4.offset }; }
    | LB REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'lb', rt: $2, base: $4.base, offset: $4.offset }; }
    | LBU REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'lbu', rt: $2, base: $4.base, offset: $4.offset }; }
    | SW REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'sw', rt: $2, base: $4.base, offset: $4.offset }; }
    | SH REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'sh', rt: $2, base: $4.base, offset: $4.offset }; }
    | SB REGISTER COMMA memory_operand
        { $$ = { id: genId(), type: 'i_type', op: 'sb', rt: $2, base: $4.base, offset: $4.offset }; }
    ;

j_type_instruction
    : J target
        { $$ = { id: genId(), type: 'j_type', op: 'j', target: $2 }; }
    | JAL target
        { $$ = { id: genId(), type: 'j_type', op: 'jal', target: $2 }; }
    ;

special_instruction
    : SYSCALL
        { $$ = { id: genId(), type: 'special', op: 'syscall' }; }
    | ERET
        { $$ = { id: genId(), type: 'special', op: 'eret' }; }
    | NOP
        { $$ = { id: genId(), type: 'special', op: 'nop' }; }
    | LI REGISTER COMMA immediate
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'li', rt: $2, immediate: $4 };
        }
    | LI REGISTER COMMA immediate_char
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'li', rt: $2, immediate: $4 };
        }
    | LI REGISTER COMMA IDENTIFIER
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'li', rt: $2, symbol: $4 };
        }
    | LA REGISTER COMMA immediate
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'la', rt: $2, immediate: $4 };
        }
    | LA REGISTER COMMA IDENTIFIER
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'la', rt: $2, symbol: $4 };
        }
    | MOVE REGISTER COMMA REGISTER
        { 
          $$ = { id: genId(), type: 'pseudo', op: 'move', rd: $2, rs: $4 };
        }
    ;

memory_operand
    : immediate LPAREN REGISTER RPAREN
        { $$ = { id: genId(), base: $3, offset: $1 }; }
    | LPAREN REGISTER RPAREN
        { $$ = { id: genId(), base: $2, offset: 0 }; }
    ;

immediate
    : NUMBER
        { $$ = parseInt($1); }
    | HEX_NUMBER
        { $$ = parseInt($1, 16); }
    | BINARY_NUMBER
        { $$ = parseInt($1, 2); }
    ;

immediate_char
    : CHAR
        { $$ = $1; }
    ;

target
    : IDENTIFIER
        { $$ = $1; }
    | immediate
        { $$ = $1; }
    ;

%%

