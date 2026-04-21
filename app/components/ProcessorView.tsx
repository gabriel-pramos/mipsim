import { useState, useCallback } from 'react';
import ComponentView from './ComponentView';
import PortField from './PortField';
import ConnectionSystem, { type PortPosition, type Connection } from './ConnectionSystem';
import type { ProcessorState } from '../core/Processor';
import type { Instruction } from '../core/encoding';

interface ProcessorViewProps {
  state: ProcessorState;
  /** Word index (byte PC / 4) → instruction (sparse; includes kernel at 0x80000180/4). */
  instructionWordMap: Map<number, Instruction>;
  /** Number of user `.text` words starting at word index 0 (for listing first instructions). */
  userTextWordCount: number;
}

function formatInstrText(instr: Instruction | undefined): string {
  if (!instr) return '—';
  const op = instr.op.toLowerCase();
  if (op === 'mfc0' || op === 'mtc0') {
    const rt = instr.rt ?? 0;
    const rd = instr.rd ?? 0;
    return `${op} $${rt}, $${rd}`;
  }
  let text = instr.op;
  if (instr.op === 'lw' || instr.op === 'sw') {
    text += ` $${instr.rt}, ${instr.offset ?? instr.immediate ?? 0}($${instr.base ?? instr.rs ?? 0})`;
  } else {
    if (instr.rd !== undefined) text += ` $${instr.rd}`;
    if (instr.rs !== undefined) text += `, $${instr.rs}`;
    if (instr.rt !== undefined) text += `, $${instr.rt}`;
    if (instr.immediate !== undefined) text += `, ${instr.immediate}`;
  }
  return text;
}

const REG_NAMES = ['$0', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'];

export default function ProcessorView({ state, instructionWordMap, userTextWordCount }: ProcessorViewProps) {
  const [positions, setPositions] = useState({
    pc:                { x: 10,  y: 10  },
    pcAdder:           { x: 120, y: 10  },
    branchMux:         { x: 10,  y: 130 },
    branchAdder:       { x: 130, y: 130 },
    shiftLeft2:        { x: 245, y: 130 },
    signExtender:      { x: 340, y: 130 },
    instructionMemory: { x: 455, y: 10  },
    controlUnit:       { x: 690, y: 10  },
    pcsrcLogic:        { x: 870, y: 10  },
    cop0:              { x: 10,  y: 280 },
    regDstMux:         { x: 340, y: 280 },
    registerFile:      { x: 130, y: 420 },
    aluSrcMux:         { x: 370, y: 480 },
    alu:               { x: 500, y: 420 },
    dataMemory:        { x: 670, y: 420 },
    memToRegMux:       { x: 840, y: 420 },
  });

  const [portPositions, setPortPositions] = useState<Map<string, PortPosition>>(new Map());

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  const handlePortPosition = useCallback((componentId: string, portId: string, x: number, y: number) => {
    setPortPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(`${componentId}.${portId}`, { x, y });
      return newMap;
    });
  }, []);

  const connections: Connection[] = [
    { from: { component: 'pc', port: 'PC-out' }, to: { component: 'instructionMemory', port: 'address' }, color: '#8b5cf6', animated: true },
    { from: { component: 'pc', port: 'PC-out2' }, to: { component: 'pcAdder', port: 'pc' }, color: '#8b5cf6' },
    { from: { component: 'pcAdder', port: 'nextPC' }, to: { component: 'branchMux', port: 'input0' }, color: '#3b82f6' },
    { from: { component: 'branchAdder', port: 'output' }, to: { component: 'branchMux', port: 'input1' }, color: '#f97316' },
    { from: { component: 'branchMux', port: 'output' }, to: { component: 'pc', port: 'input' }, color: '#3b82f6', animated: true },
    { from: { component: 'pcAdder', port: 'nextPC' }, to: { component: 'branchAdder', port: 'a' }, color: '#3b82f6' },
    { from: { component: 'shiftLeft2', port: 'shifted' }, to: { component: 'branchAdder', port: 'b' }, color: '#ec4899' },
    { from: { component: 'signExtender', port: 'signExtended' }, to: { component: 'shiftLeft2', port: 'signExtended' }, color: '#ec4899' },
    { from: { component: 'alu', port: 'zero-out' }, to: { component: 'pcsrcLogic', port: 'zero' }, color: '#f59e0b' },
    { from: { component: 'controlUnit', port: 'branch' }, to: { component: 'pcsrcLogic', port: 'branch' }, color: '#6366f1' },
    { from: { component: 'controlUnit', port: 'branchNe' }, to: { component: 'pcsrcLogic', port: 'branchNe' }, color: '#6366f1' },
    { from: { component: 'pcsrcLogic', port: 'pcSrc' }, to: { component: 'branchMux', port: 'selector' }, color: '#6366f1' },
    { from: { component: 'instructionMemory', port: 'instruction' }, to: { component: 'controlUnit', port: 'instruction' }, color: '#ef4444', animated: true },
    { from: { component: 'instructionMemory', port: 'rs' }, to: { component: 'registerFile', port: 'rs' }, color: '#f59e0b' },
    { from: { component: 'instructionMemory', port: 'rt-read' }, to: { component: 'registerFile', port: 'rt' }, color: '#f59e0b' },
    { from: { component: 'instructionMemory', port: 'rt-mux' }, to: { component: 'regDstMux', port: 'input0' }, color: '#a855f7' },
    { from: { component: 'instructionMemory', port: 'rd' }, to: { component: 'regDstMux', port: 'input1' }, color: '#a855f7' },
    { from: { component: 'regDstMux', port: 'output' }, to: { component: 'registerFile', port: 'writeReg' }, color: '#a855f7', animated: true },
    { from: { component: 'instructionMemory', port: 'immediate' }, to: { component: 'signExtender', port: 'immediate' }, color: '#ec4899' },
    { from: { component: 'registerFile', port: 'readData1' }, to: { component: 'alu', port: 'readData1' }, color: '#10b981', animated: true },
    { from: { component: 'registerFile', port: 'readData2' }, to: { component: 'aluSrcMux', port: 'input0' }, color: '#10b981' },
    { from: { component: 'signExtender', port: 'signExtended' }, to: { component: 'aluSrcMux', port: 'input1' }, color: '#ec4899' },
    { from: { component: 'aluSrcMux', port: 'output' }, to: { component: 'alu', port: 'readData2' }, color: '#06b6d4', animated: true },
    { from: { component: 'alu', port: 'result' }, to: { component: 'dataMemory', port: 'address' }, color: '#f59e0b', animated: true },
    { from: { component: 'registerFile', port: 'readData2-mem' }, to: { component: 'dataMemory', port: 'writeData' }, color: '#10b981' },
    { from: { component: 'alu', port: 'result-mux' }, to: { component: 'memToRegMux', port: 'input0' }, color: '#f59e0b' },
    { from: { component: 'dataMemory', port: 'readData' }, to: { component: 'memToRegMux', port: 'input1' }, color: '#14b8a6' },
    { from: { component: 'memToRegMux', port: 'output' }, to: { component: 'registerFile', port: 'writeData' }, color: '#14b8a6', animated: true },
  ];

  const pcWord = (state.pc >>> 2) >>> 0;
  const currentInstr = instructionWordMap.get(pcWord);
  const isMemInstr = currentInstr && (currentInstr.op === 'lw' || currentInstr.op === 'sw');

  // Reusable value display styles
  const valueBox = "font-mono text-[11px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-center text-zinc-900";
  const sectionLabel = "text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mt-1.5 mb-0.5";

  return (
    <div className="flex-1 min-h-0 min-w-0 bg-white border border-zinc-200 rounded-md overflow-auto relative">
      <div className="relative w-full h-full p-2" data-canvas>
        <ConnectionSystem connections={connections} portPositions={portPositions} />

        {/* Program Counter */}
        <ComponentView
          id="pc"
          title="PC"
          color="#8b5cf6"
          x={positions.pc.x}
          y={positions.pc.y}
          width={105}
          onPositionChange={handlePositionChange}
        >
          <div className={valueBox}>
            {state.pc}
            <div className="text-[9px] text-zinc-400">0x{state.pc.toString(16).toUpperCase().padStart(8, '0')}</div>
          </div>
          <PortField id="input" componentId="pc" type="input" label="In" onPortPosition={handlePortPosition} />
          <PortField id="PC-out" componentId="pc" type="output" label="PC" value={state.pc} onPortPosition={handlePortPosition} />
          <PortField id="PC-out2" componentId="pc" type="output" label="PC" value={state.pc} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* PC + 4 Adder */}
        <ComponentView
          id="pcAdder"
          title="PC + 4"
          color="#3b82f6"
          x={positions.pcAdder.x}
          y={positions.pcAdder.y}
          width={85}
          onPositionChange={handlePositionChange}
        >
          <PortField id="pc" componentId="pcAdder" type="input" label="PC" value={state.pc} onPortPosition={handlePortPosition} />
          <div className="text-center text-xs font-bold my-1 text-blue-500">+ 4</div>
          <PortField id="nextPC" componentId="pcAdder" type="output" label="Next" value={state.nextPC} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Branch MUX */}
        <ComponentView
          id="branchMux"
          title="MUX (PC)"
          color="#2563eb"
          x={positions.branchMux.x}
          y={positions.branchMux.y}
          width={110}
          onPositionChange={handlePositionChange}
        >
          <PortField id="input0" componentId="branchMux" type="input" label="PC+4" value={state.nextPC} onPortPosition={handlePortPosition} />
          <PortField id="input1" componentId="branchMux" type="input" label="BrT" value={state.branchTarget} onPortPosition={handlePortPosition} />
          <PortField id="selector" componentId="branchMux" type="input" label="Sel" value={state.pcSrc} onPortPosition={handlePortPosition} />
          <div className={`text-center text-[10px] font-semibold my-1 px-1 py-0.5 rounded ${state.pcSrc ? 'bg-indigo-50 text-indigo-700' : 'bg-zinc-50 text-zinc-500'}`}>
            {state.pcSrc ? 'Branch' : 'PC+4'}
          </div>
          <PortField id="output" componentId="branchMux" type="output" label="Out" value={state.muxOutputs.branchPc} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Branch Adder */}
        <ComponentView
          id="branchAdder"
          title="Br Adder"
          color="#ea580c"
          x={positions.branchAdder.x}
          y={positions.branchAdder.y}
          width={100}
          onPositionChange={handlePositionChange}
        >
          <PortField id="a" componentId="branchAdder" type="input" label="PC+4" value={state.nextPC} onPortPosition={handlePortPosition} />
          <PortField id="b" componentId="branchAdder" type="input" label="Off" value={state.shiftLeft2} onPortPosition={handlePortPosition} />
          <div className="text-center text-xs font-bold my-1 text-orange-500">+</div>
          <PortField id="output" componentId="branchAdder" type="output" label="Tgt" value={state.branchTarget} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Shift left 2 */}
        <ComponentView
          id="shiftLeft2"
          title="<< 2"
          color="#db2777"
          x={positions.shiftLeft2.x}
          y={positions.shiftLeft2.y}
          width={90}
          onPositionChange={handlePositionChange}
        >
          <PortField id="signExtended" componentId="shiftLeft2" type="input" label="Ext" value={state.signExtended} onPortPosition={handlePortPosition} />
          <PortField id="shifted" componentId="shiftLeft2" type="output" label="×4" value={state.shiftLeft2} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Sign Extender */}
        <ComponentView
          id="signExtender"
          title="Sign Extend"
          color="#ec4899"
          x={positions.signExtender.x}
          y={positions.signExtender.y}
          width={110}
          onPositionChange={handlePositionChange}
        >
          <PortField id="immediate" componentId="signExtender" type="input" label="Imm" value={state.instructionFields.immediate} onPortPosition={handlePortPosition} />
          <div className="text-center text-[10px] font-semibold my-1 text-pink-500">16 → 32</div>
          <PortField id="signExtended" componentId="signExtender" type="output" label="Ext" value={state.signExtended} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Instruction Memory */}
        <ComponentView
          id="instructionMemory"
          title="Instruction Memory"
          color="#ef4444"
          x={positions.instructionMemory.x}
          y={positions.instructionMemory.y}
          width={220}
          onPositionChange={handlePositionChange}
        >
          <PortField id="address" componentId="instructionMemory" type="input" label="Addr" value={state.instructionAddress} onPortPosition={handlePortPosition} />

          <div className={sectionLabel}>Current</div>
          <div className="px-1.5 py-1 bg-red-50 border border-red-100 rounded">
            <div className="text-[11px] font-mono font-semibold text-zinc-900">
              {currentInstr ? formatInstrText(currentInstr) : 'nop'}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">0x{state.instruction.toString(16).toUpperCase().padStart(8, '0')}</div>
          </div>

          <div className={sectionLabel}>Program</div>
          <div className="max-h-[80px] overflow-y-auto p-1 bg-zinc-50 border border-zinc-200 rounded">
            {Array.from(
              { length: Math.min(8, userTextWordCount) },
              (_, idx) => instructionWordMap.get(idx),
            ).map((instr, idx) => (
              <div
                key={idx}
                className={`text-[10px] font-mono px-1 py-0.5 rounded-sm flex gap-1 ${idx === pcWord ? 'bg-red-100 font-semibold text-red-900' : 'text-zinc-600'}`}
              >
                <span className="text-zinc-400 w-4 text-right">{idx}</span>
                <span className="truncate">{instr ? formatInstrText(instr) : '—'}</span>
              </div>
            ))}
          </div>

          <div className={sectionLabel}>Fields</div>
          <div className="grid grid-cols-2 gap-0.5">
            <PortField id="instruction" componentId="instructionMemory" type="output" label="Ins" onPortPosition={handlePortPosition} />
            <PortField id="rs" componentId="instructionMemory" type="output" label="RS" value={state.instructionFields.rs} onPortPosition={handlePortPosition} />
            <PortField id="rt-read" componentId="instructionMemory" type="output" label="RT" value={state.instructionFields.rt} onPortPosition={handlePortPosition} />
            <PortField id="rt-mux" componentId="instructionMemory" type="output" label="RT" value={state.instructionFields.rt} onPortPosition={handlePortPosition} />
            <PortField id="rd" componentId="instructionMemory" type="output" label="RD" value={state.instructionFields.rd} onPortPosition={handlePortPosition} />
            <PortField id="immediate" componentId="instructionMemory" type="output" label="Imm" value={state.instructionFields.immediate} onPortPosition={handlePortPosition} />
          </div>
        </ComponentView>

        {/* Control Unit */}
        <ComponentView
          id="controlUnit"
          title="Control Unit"
          color="#6366f1"
          x={positions.controlUnit.x}
          y={positions.controlUnit.y}
          width={170}
          onPositionChange={handlePositionChange}
        >
          <PortField id="instruction" componentId="controlUnit" type="input" label="Ins" onPortPosition={handlePortPosition} />

          <div className={sectionLabel}>Signals</div>
          <div className="grid grid-cols-2 gap-x-1.5 text-[10px]">
            {[
              ['RegDst', state.controlSignals.regDst],
              ['ALUSrc', state.controlSignals.aluSrc],
              ['MemToReg', state.controlSignals.memToReg],
              ['RegWrite', state.controlSignals.regWrite],
              ['MemRead', state.controlSignals.memRead],
              ['MemWrite', state.controlSignals.memWrite],
              ['Branch', state.controlSignals.branch],
              ['BranchNe', state.controlSignals.branchNe],
              ['Jump', state.controlSignals.jump],
            ].map(([name, val]) => (
              <div key={name as string} className="flex justify-between py-0.5">
                <span className="text-zinc-500 truncate">{name}</span>
                <span className={val ? 'text-emerald-600 font-semibold' : 'text-zinc-300 font-semibold'}>{val as number}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] py-0.5 mt-0.5 border-t border-zinc-100">
            <span className="text-zinc-500">ALUOp</span>
            <span className="font-mono font-semibold text-zinc-900">{state.controlSignals.aluOp}</span>
          </div>

          <div className={sectionLabel}>Outputs</div>
          <div className="grid grid-cols-2 gap-0.5">
            <PortField id="regDst" componentId="controlUnit" type="output" label="RgD" value={state.controlSignals.regDst} onPortPosition={handlePortPosition} />
            <PortField id="aluSrc" componentId="controlUnit" type="output" label="ASr" value={state.controlSignals.aluSrc} onPortPosition={handlePortPosition} />
            <PortField id="memToReg" componentId="controlUnit" type="output" label="M2R" value={state.controlSignals.memToReg} onPortPosition={handlePortPosition} />
            <PortField id="regWrite" componentId="controlUnit" type="output" label="RgW" value={state.controlSignals.regWrite} onPortPosition={handlePortPosition} />
            <PortField id="memRead" componentId="controlUnit" type="output" label="MRd" value={state.controlSignals.memRead} onPortPosition={handlePortPosition} />
            <PortField id="memWrite" componentId="controlUnit" type="output" label="MWr" value={state.controlSignals.memWrite} onPortPosition={handlePortPosition} />
            <PortField id="branch" componentId="controlUnit" type="output" label="Br" value={state.controlSignals.branch} onPortPosition={handlePortPosition} />
            <PortField id="branchNe" componentId="controlUnit" type="output" label="BNE" value={state.controlSignals.branchNe} onPortPosition={handlePortPosition} />
            <PortField id="aluOp" componentId="controlUnit" type="output" label="Op" value={state.controlSignals.aluOp} onPortPosition={handlePortPosition} />
          </div>
        </ComponentView>

        {/* PCSrc logic */}
        <ComponentView
          id="pcsrcLogic"
          title="PCSrc"
          color="#4f46e5"
          x={positions.pcsrcLogic.x}
          y={positions.pcsrcLogic.y}
          width={105}
          onPositionChange={handlePositionChange}
        >
          <PortField id="branch" componentId="pcsrcLogic" type="input" label="Br" value={state.controlSignals.branch} onPortPosition={handlePortPosition} />
          <PortField id="branchNe" componentId="pcsrcLogic" type="input" label="BNE" value={state.controlSignals.branchNe} onPortPosition={handlePortPosition} />
          <PortField id="zero" componentId="pcsrcLogic" type="input" label="Z" value={state.aluOutputs.zero} onPortPosition={handlePortPosition} />
          <PortField id="pcSrc" componentId="pcsrcLogic" type="output" label="Out" value={state.pcSrc} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Coprocessor 0 */}
        <ComponentView
          id="cop0"
          title="Coprocessor 0"
          color="#b45309"
          x={positions.cop0.x}
          y={positions.cop0.y}
          width={135}
          onPositionChange={handlePositionChange}
        >
          <div className={sectionLabel}>Status</div>
          <div className={valueBox}>
            0x{state.cop0.status.toString(16).toUpperCase().padStart(8, '0')}
            <div className="text-[9px] text-zinc-500">
              IE{(state.cop0.status & 1) ? '1' : '0'} · EXL{(state.cop0.status & 2) ? '1' : '0'} · UM{(state.cop0.status & 0x10) ? '1' : '0'}
            </div>
          </div>
          <div className={sectionLabel}>Cause</div>
          <div className={valueBox}>
            0x{state.cop0.cause.toString(16).toUpperCase().padStart(8, '0')}
          </div>
          <div className={sectionLabel}>EPC</div>
          <div className={valueBox}>
            0x{state.cop0.epc.toString(16).toUpperCase().padStart(8, '0')}
          </div>
          <div
            className={`text-center text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1.5 ${
              state.cop0.userMode ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {state.cop0.userMode ? 'User' : 'Kernel'}
          </div>
        </ComponentView>

        {/* RegDst MUX */}
        <ComponentView
          id="regDstMux"
          title="MUX (RegDst)"
          color="#a855f7"
          x={positions.regDstMux.x}
          y={positions.regDstMux.y}
          width={105}
          onPositionChange={handlePositionChange}
        >
          <PortField id="input0" componentId="regDstMux" type="input" label="RT" value={state.instructionFields.rt} onPortPosition={handlePortPosition} />
          <PortField id="input1" componentId="regDstMux" type="input" label="RD" value={state.instructionFields.rd} onPortPosition={handlePortPosition} />
          <PortField id="selector" componentId="regDstMux" type="input" label="Sel" value={state.controlSignals.regDst} onPortPosition={handlePortPosition} />
          <div className={`text-center text-[10px] font-semibold my-1 px-1 py-0.5 rounded ${state.controlSignals.regDst ? 'bg-purple-50 text-purple-700' : 'bg-zinc-50 text-zinc-500'}`}>
            {state.controlSignals.regDst ? 'RD' : 'RT'}
          </div>
          <PortField id="output" componentId="regDstMux" type="output" label="Wr" value={state.muxOutputs.regDst} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Register File */}
        <ComponentView
          id="registerFile"
          title="Register File"
          color="#10b981"
          x={positions.registerFile.x}
          y={positions.registerFile.y}
          width={230}
          onPositionChange={handlePositionChange}
        >
          <div className="grid grid-cols-2 gap-x-1">
            <PortField id="rs" componentId="registerFile" type="input" label="RS" value={state.instructionFields.rs} onPortPosition={handlePortPosition} />
            <PortField id="rt" componentId="registerFile" type="input" label="RT" value={state.instructionFields.rt} onPortPosition={handlePortPosition} />
            <PortField id="writeReg" componentId="registerFile" type="input" label="Wr" value={state.muxOutputs.regDst} onPortPosition={handlePortPosition} />
            <PortField id="writeData" componentId="registerFile" type="input" label="Dat" value={state.muxOutputs.memToReg} onPortPosition={handlePortPosition} />
          </div>

          <div className={sectionLabel}>Registers</div>
          <div className="grid grid-cols-4 gap-0.5 max-h-[130px] overflow-y-auto p-1 bg-zinc-50 border border-zinc-200 rounded">
            {state.registers.slice(0, 32).map((val, i) => {
              const isActive = i === state.instructionFields.rs ||
                              i === state.instructionFields.rt ||
                              (i === state.muxOutputs.regDst && state.controlSignals.regWrite);
              return (
                <div
                  key={i}
                  className={`flex justify-between text-[9px] px-1 py-0.5 rounded-sm ${isActive ? 'bg-amber-100 font-semibold' : 'bg-white'}`}
                  title={`${REG_NAMES[i]} = ${val}`}
                >
                  <span className="text-zinc-500">{REG_NAMES[i]}</span>
                  <span className="font-mono text-zinc-900 truncate">{val}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-x-1 mt-1">
            <PortField id="readData1" componentId="registerFile" type="output" label="R1" value={state.aluInputs.readData1} onPortPosition={handlePortPosition} />
            <PortField id="readData2" componentId="registerFile" type="output" label="R2" value={state.aluInputs.readData2} onPortPosition={handlePortPosition} />
            <PortField id="readData2-mem" componentId="registerFile" type="output" label="R2" value={state.aluInputs.readData2} onPortPosition={handlePortPosition} />
          </div>
        </ComponentView>

        {/* ALUSrc MUX */}
        <ComponentView
          id="aluSrcMux"
          title="MUX (ALUSrc)"
          color="#06b6d4"
          x={positions.aluSrcMux.x}
          y={positions.aluSrcMux.y}
          width={110}
          onPositionChange={handlePositionChange}
        >
          <PortField id="input0" componentId="aluSrcMux" type="input" label="R2" value={state.aluInputs.readData2} onPortPosition={handlePortPosition} />
          <PortField id="input1" componentId="aluSrcMux" type="input" label="Ext" value={state.signExtended} onPortPosition={handlePortPosition} />
          <PortField id="selector" componentId="aluSrcMux" type="input" label="Sel" value={state.controlSignals.aluSrc} onPortPosition={handlePortPosition} />
          <div className={`text-center text-[10px] font-semibold my-1 px-1 py-0.5 rounded ${state.controlSignals.aluSrc ? 'bg-cyan-50 text-cyan-700' : 'bg-zinc-50 text-zinc-500'}`}>
            {state.controlSignals.aluSrc ? 'Imm' : 'Reg'}
          </div>
          <PortField id="output" componentId="aluSrcMux" type="output" label="B" value={state.muxOutputs.aluSrc} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* ALU */}
        <ComponentView
          id="alu"
          title="ALU"
          color="#f59e0b"
          x={positions.alu.x}
          y={positions.alu.y}
          width={155}
          onPositionChange={handlePositionChange}
        >
          <PortField id="readData1" componentId="alu" type="input" label="A" value={state.aluInputs.readData1} onPortPosition={handlePortPosition} />
          <PortField id="readData2" componentId="alu" type="input" label="B" value={state.muxOutputs.aluSrc} onPortPosition={handlePortPosition} />
          <PortField id="aluOp" componentId="alu" type="input" label="Op" value={state.aluInputs.aluOp} onPortPosition={handlePortPosition} />

          <div className="my-1.5 px-2 py-1 bg-amber-50 border border-amber-100 rounded text-center">
            <div className="text-[9px] text-amber-700 uppercase tracking-wider">Op</div>
            <div className="text-sm font-mono font-bold text-amber-800">
              {(() => {
                switch (state.aluInputs.aluOp) {
                  case 0b000: return 'AND';
                  case 0b001: return 'OR';
                  case 0b010: return 'ADD';
                  case 0b110: return 'SUB';
                  case 0b111: return 'SLT';
                  default: return 'ADD';
                }
              })()}
            </div>
            <div className="text-[11px] font-mono font-semibold text-zinc-900 mt-0.5">
              = {state.aluOutputs.result}
            </div>
          </div>

          <div className="flex justify-between px-1.5 text-[10px] mb-1">
            <span className="text-zinc-500">Zero</span>
            <span className={state.aluOutputs.zero ? 'text-emerald-600 font-semibold' : 'text-zinc-300 font-semibold'}>
              {state.aluOutputs.zero ? '1' : '0'}
            </span>
          </div>

          <PortField id="result" componentId="alu" type="output" label="Res" value={state.aluOutputs.result} onPortPosition={handlePortPosition} />
          <PortField id="result-mux" componentId="alu" type="output" label="Res" value={state.aluOutputs.result} onPortPosition={handlePortPosition} />
          <PortField id="zero-out" componentId="alu" type="output" label="Z" value={state.aluOutputs.zero} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* Data Memory */}
        <ComponentView
          id="dataMemory"
          title="Data Memory"
          color="#14b8a6"
          x={positions.dataMemory.x}
          y={positions.dataMemory.y}
          width={160}
          onPositionChange={handlePositionChange}
        >
          <PortField id="address" componentId="dataMemory" type="input" label="Ad" value={state.dataMemory.address} onPortPosition={handlePortPosition} />
          <PortField id="writeData" componentId="dataMemory" type="input" label="Wr" value={state.dataMemory.writeData} onPortPosition={handlePortPosition} />

          <div className={`my-1 px-1.5 py-1 rounded text-center border ${isMemInstr ? 'bg-teal-50 border-teal-100' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
              {isMemInstr ? (currentInstr?.op === 'lw' ? 'Read' : 'Write') : 'Idle'}
            </div>
            {state.controlSignals.memRead || state.controlSignals.memWrite ? (
              <div className="text-[10px] font-mono text-zinc-900">
                [{state.dataMemory.address}] ={' '}
                {state.controlSignals.memWrite
                  ? state.dataMemory.writeData
                  : state.dataMemory.readData}
              </div>
            ) : null}
          </div>

          <PortField id="readData" componentId="dataMemory" type="output" label="Rd" value={state.dataMemory.readData} onPortPosition={handlePortPosition} />
        </ComponentView>

        {/* MemToReg MUX */}
        <ComponentView
          id="memToRegMux"
          title="MUX (MemToReg)"
          color="#14b8a6"
          x={positions.memToRegMux.x}
          y={positions.memToRegMux.y}
          width={125}
          onPositionChange={handlePositionChange}
        >
          <PortField id="input0" componentId="memToRegMux" type="input" label="ALU" value={state.aluOutputs.result} onPortPosition={handlePortPosition} />
          <PortField id="input1" componentId="memToRegMux" type="input" label="Mem" value={state.dataMemory.readData} onPortPosition={handlePortPosition} />
          <PortField id="selector" componentId="memToRegMux" type="input" label="Sel" value={state.controlSignals.memToReg} onPortPosition={handlePortPosition} />
          <div className={`text-center text-[10px] font-semibold my-1 px-1 py-0.5 rounded ${state.controlSignals.memToReg ? 'bg-teal-50 text-teal-700' : 'bg-zinc-50 text-zinc-500'}`}>
            {state.controlSignals.memToReg ? 'Mem' : 'ALU'}
          </div>
          <PortField id="output" componentId="memToRegMux" type="output" label="Wr" value={state.muxOutputs.memToReg} onPortPosition={handlePortPosition} />
        </ComponentView>
      </div>
    </div>
  );
}
