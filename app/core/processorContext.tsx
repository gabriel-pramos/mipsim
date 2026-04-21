import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { Processor, type ProcessorState } from './Processor';
import type { Instruction } from './encoding';

interface ProcessorContextValue {
  state: ProcessorState;
  instructionWordMap: Map<number, Instruction>;
  userTextWordCount: number;
  isRunning: boolean;
  executionSpeed: number;
  code: string;
  pastUser: boolean;
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
  const [instructionWordMap, setInstructionWordMap] = useState<Map<number, Instruction>>(
    () => new Map(),
  );
  const [userTextWordCount, setUserTextWordCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1000);
  const [code, setCode] = useState(DEFAULT_CODE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInstructions = useCallback(
    (map: Map<number, Instruction>, uw: number, dataBytes?: number[]) => {
      processor.loadInstructionMap(map, uw);
      if (dataBytes && dataBytes.length > 0) {
        processor.loadDataSegment(dataBytes);
      }
      setInstructionWordMap(new Map(map));
      setUserTextWordCount(uw);
      setState(processor.getState());
    },
    [processor],
  );

  const step = useCallback(() => {
    processor.step();
    setState(processor.getState());
  }, [processor]);

  const run = useCallback(() => {
    setIsRunning(true);
    const interval = setInterval(() => {
      processor.step();
      const newState = processor.getState();
      setState(newState);

      if (processor.isPcPastUserText(newState.pc)) {
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
    setState(processor.getState());
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [processor]);

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
    instructionWordMap,
    userTextWordCount,
    isRunning,
    executionSpeed,
    code,
    pastUser,
    loadInstructions,
    step,
    run,
    stop,
    reset,
    sendToTerminal,
    setSpeed,
    setCode,
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
