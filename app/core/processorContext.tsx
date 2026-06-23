import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { Processor, type ProcessorState } from './Processor';
import type { Instruction } from './encoding';

interface ProcessorContextValue {
  state: ProcessorState;
  /** Snapshot of `state.registers` taken just before the most recent step (or initial state). */
  prevRegisters: number[];
  instructionWordMap: Map<number, Instruction>;
  userTextWordCount: number;
  isRunning: boolean;
  executionSpeed: number;
  code: string;
  pastUser: boolean;
  /** Instructions executed since the last load or reset. */
  stepCount: number;
  /** Word indices (byte PC / 4) where execution should pause when running. */
  breakpoints: Set<number>;
  loadInstructions: (
    map: Map<number, Instruction>,
    uw: number,
    dataBytes?: number[],
  ) => void;
  step: () => void;
  run: () => void;
  stop: () => void;
  reset: () => void;
  sendToTerminal: (text: string) => void;
  setSpeed: (ms: number) => void;
  setCode: (code: string) => void;
  toggleBreakpoint: (wordIdx: number) => void;
  clearBreakpoints: () => void;
}

const ProcessorContext = createContext<ProcessorContextValue | null>(null);

const DEFAULT_CODE = `.text
.globl main
main:
    addi $t0, $zero, 42
    sw $t0, 0($zero)
    lw $t1, 0($zero)
    add $t2, $t0, $t1
    sub $t3, $t2, $t0`;

export function ProcessorProvider({ children }: { children: ReactNode }) {
  const [processor] = useState(() => new Processor());
  const [state, setState] = useState<ProcessorState>(() => processor.getState());
  const [prevRegisters, setPrevRegisters] = useState<number[]>(() => [...processor.getState().registers]);
  const [instructionWordMap, setInstructionWordMap] = useState<Map<number, Instruction>>(
    () => new Map(),
  );
  const [userTextWordCount, setUserTextWordCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(() => new Set());
  const [stepCount, setStepCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Live mirror of breakpoints so the running interval sees current values
  // without restarting whenever the user toggles a breakpoint.
  const breakpointsRef = useRef<Set<number>>(breakpoints);
  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  const loadInstructions = useCallback(
    (map: Map<number, Instruction>, uw: number, dataBytes?: number[]) => {
      processor.loadInstructionMap(map, uw);
      if (dataBytes && dataBytes.length > 0) {
        processor.loadDataSegment(dataBytes);
      }
      setInstructionWordMap(new Map(map));
      setUserTextWordCount(uw);
      const fresh = processor.getState();
      setState(fresh);
      setPrevRegisters([...fresh.registers]);
      setBreakpoints(new Set());
      setStepCount(0);
    },
    [processor],
  );

  const step = useCallback(() => {
    const before = [...processor.getState().registers];
    processor.step();
    setPrevRegisters(before);
    setState(processor.getState());
    setStepCount((n) => n + 1);
  }, [processor]);

  const run = useCallback(() => {
    setIsRunning(true);
    const interval = setInterval(() => {
      const before = [...processor.getState().registers];
      processor.step();
      const newState = processor.getState();
      setPrevRegisters(before);
      setState(newState);
      setStepCount((n) => n + 1);

      const pcWord = (newState.pc >>> 2) >>> 0;
      if (
        processor.isPcPastUserText(newState.pc) ||
        breakpointsRef.current.has(pcWord)
      ) {
        setIsRunning(false);
        clearInterval(interval);
        intervalRef.current = null;
      }
    }, executionSpeed);

    intervalRef.current = interval;
  }, [processor, executionSpeed]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    processor.reset();
    const fresh = processor.getState();
    setState(fresh);
    setPrevRegisters([...fresh.registers]);
    setStepCount(0);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [processor]);

  const toggleBreakpoint = useCallback((wordIdx: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(wordIdx)) next.delete(wordIdx);
      else next.add(wordIdx);
      return next;
    });
  }, []);

  const clearBreakpoints = useCallback(() => {
    setBreakpoints(new Set());
  }, []);

  const sendToTerminal = useCallback(
    (text: string) => {
      processor.enqueueKeyboardAscii(text);
      setState(processor.getState());
    },
    [processor],
  );

  const setSpeed = useCallback((ms: number) => {
    setExecutionSpeed(ms);
  }, []);

  const pastUser = processor.isPcPastUserText(state.pc);

  const value: ProcessorContextValue = {
    state,
    prevRegisters,
    instructionWordMap,
    userTextWordCount,
    isRunning,
    executionSpeed,
    code,
    pastUser,
    stepCount,
    breakpoints,
    loadInstructions,
    step,
    run,
    stop,
    reset,
    sendToTerminal,
    setSpeed,
    setCode,
    toggleBreakpoint,
    clearBreakpoints,
  };

  return (
    <ProcessorContext value={value}>
      {children}
    </ProcessorContext>
  );
}

export function useProcessor(): ProcessorContextValue {
  const ctx = useContext(ProcessorContext);
  if (!ctx) throw new Error('useProcessor must be used within ProcessorProvider');
  return ctx;
}
