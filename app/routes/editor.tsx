import { useNavigate } from 'react-router';
import type { Route } from "./+types/editor";
import MIPSCodeEditor from '../components/MIPSCodeEditor';
import { useProcessor } from '../core/processorContext';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MIPSim — Editor" },
    { name: "description", content: "Write and load MIPS assembly programs" },
  ];
}

export default function EditorPage() {
  const navigate = useNavigate();
  const { loadInstructions, code, setCode, reset } = useProcessor();

  const handleAfterLoad = () => {
    reset();
    navigate('/simulator');
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Assembly Editor</h1>
          <p className="text-sm text-zinc-500">
            Write MIPS assembly or load a sample program, then send it to the simulator.
          </p>
        </div>
        <MIPSCodeEditor
          onLoadInstructions={loadInstructions}
          code={code}
          onCodeChange={setCode}
          onAfterLoad={handleAfterLoad}
        />
      </div>
    </div>
  );
}
